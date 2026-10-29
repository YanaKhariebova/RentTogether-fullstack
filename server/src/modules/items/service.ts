import { Prisma } from '../../generated/prisma/client.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { ApiError } from '../../lib/errors.js';
import { requireOwner } from '../../middleware/requireAuth.js';
import type { CreateItemData, PublicItemsQuery, UpdateItemData } from './schemas.js';
import type { ImageStorage } from './storage/ImageStorage.js';
import { ImageUploadError } from './storage/ImageUploadError.js';
import { MAX_ITEM_IMAGES } from './imageValidation.js';
import { flushImageCleanup } from './imageCleanup.js';

export type ItemsDatabase = Pick<
  PrismaClient,
  'item' | 'category' | '$transaction' | 'imageCleanup'
>;

const ownerItemSelect = {
  id: true,
  title: true,
  description: true,
  city: true,
  pricePerDay: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true } },
  owner: { select: { id: true, name: true, city: true } },
  images: { select: { id: true, url: true, order: true }, orderBy: { order: 'asc' } },
} satisfies Prisma.ItemSelect;

type SelectedItem = Prisma.ItemGetPayload<{ select: typeof ownerItemSelect }>;

function toOwnerItem(item: SelectedItem) {
  return {
    ...item,
    pricePerDay: item.pricePerDay.toFixed(2),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function toPublicItem(item: SelectedItem) {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    city: item.city,
    pricePerDay: item.pricePerDay.toFixed(2),
    isPublished: item.isPublished,
    category: item.category,
    owner: item.owner,
    images: item.images,
  };
}

async function requireCategory(tx: Prisma.TransactionClient, categoryId: string) {
  if (!(await tx.category.findUnique({ where: { id: categoryId }, select: { id: true } }))) {
    throw new ApiError(400, 'CATEGORY_NOT_FOUND', 'Die Kategorie wurde nicht gefunden.', {
      categoryId: ['Bitte wähle eine vorhandene Kategorie aus.'],
    });
  }
}

async function lockOwnedItem(tx: Prisma.TransactionClient, id: string, ownerId: string) {
  // Будущие изменения фото должны брать тот же lock, чтобы проверка публикации была атомарной.
  const rows = await tx.$queryRaw<{ id: string; ownerId: string }[]>(
    Prisma.sql`SELECT "id", "ownerId" FROM "Item" WHERE "id" = ${id}::uuid FOR UPDATE`,
  );
  const item = rows[0];
  if (!item) throw new ApiError(404, 'ITEM_NOT_FOUND', 'Die Anzeige wurde nicht gefunden.');
  requireOwner(item.ownerId, ownerId);
}

function rethrowWriteError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      throw new ApiError(404, 'ITEM_NOT_FOUND', 'Die Anzeige wurde nicht gefunden.');
    }
    if (error.code === 'P2003') {
      throw new ApiError(
        409,
        'ITEM_RELATION_CHANGED',
        'Die zugehörigen Daten haben sich geändert. Bitte lade die Seite neu.',
      );
    }
  }
  throw error;
}

export function createItemsService(prisma: ItemsDatabase, storage?: ImageStorage) {
  return {
    async listPublishedCities() {
      const rows = await prisma.item.findMany({
        where: { isPublished: true },
        distinct: ['city'],
        select: { city: true },
        orderBy: { city: 'asc' },
      });
      return rows.map((row) => row.city);
    },

    async listPublished(query: PublicItemsQuery) {
      const where: Prisma.ItemWhereInput = { isPublished: true };
      if (query.q) {
        where.OR = [
          { title: { contains: query.q, mode: 'insensitive' } },
          { description: { contains: query.q, mode: 'insensitive' } },
        ];
      }
      if (query.city) where.city = { equals: query.city, mode: 'insensitive' };
      if (query.categoryId) where.categoryId = query.categoryId;
      if (query.minPrice || query.maxPrice) {
        where.pricePerDay = { gte: query.minPrice, lte: query.maxPrice };
      }

      const [items, total] = await Promise.all([
        prisma.item.findMany({
          where,
          select: ownerItemSelect,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        prisma.item.count({ where }),
      ]);
      return {
        items: items.map(toPublicItem),
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
        },
      };
    },

    async getPublished(id: string) {
      const item = await prisma.item.findFirst({
        where: { id, isPublished: true },
        select: ownerItemSelect,
      });
      if (!item) throw new ApiError(404, 'ITEM_NOT_FOUND', 'Die Anzeige wurde nicht gefunden.');
      return toPublicItem(item);
    },

    async listMine(ownerId: string) {
      const items = await prisma.item.findMany({
        where: { ownerId },
        select: ownerItemSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      });
      return items.map(toOwnerItem);
    },

    async assertOwner(ownerId: string, id: string) {
      const item = await prisma.item.findUnique({ where: { id }, select: { ownerId: true } });
      if (!item) throw new ApiError(404, 'ITEM_NOT_FOUND', 'Die Anzeige wurde nicht gefunden.');
      requireOwner(item.ownerId, ownerId);
    },

    async uploadImage(ownerId: string, id: string, image: Parameters<ImageStorage['upload']>[0]) {
      if (!storage)
        throw new ApiError(
          503,
          'IMAGE_STORAGE_NOT_CONFIGURED',
          'Fotos können derzeit nicht hochgeladen werden.',
        );
      // Сетевой upload вне транзакции: не держим блокировку БД во время работы провайдера.
      const owned = await prisma.item.findUnique({ where: { id }, select: { ownerId: true } });
      if (!owned) throw new ApiError(404, 'ITEM_NOT_FOUND', 'Die Anzeige wurde nicht gefunden.');
      requireOwner(owned.ownerId, ownerId);
      let uploadedKey: string | undefined;
      try {
        const uploaded = await storage.upload(image);
        uploadedKey = uploaded.key;
        const url = storage.getPublicUrl(uploaded.key);
        return await prisma.$transaction(
          async (tx) => {
            await lockOwnedItem(tx, id, ownerId);
            if ((await tx.itemImage.count({ where: { itemId: id } })) >= MAX_ITEM_IMAGES) {
              throw new ApiError(
                409,
                'ITEM_IMAGES_LIMIT',
                'Du kannst höchstens 8 Fotos hinzufügen.',
                {
                  images: ['Du kannst höchstens 8 Fotos hinzufügen.'],
                },
              );
            }
            const { _max } = await tx.itemImage.aggregate({
              where: { itemId: id },
              _max: { order: true },
            });
            const saved = await tx.itemImage.create({
              data: { itemId: id, url, storageKey: uploaded.key, order: (_max.order ?? -1) + 1 },
              select: { id: true, url: true, order: true },
            });
            await tx.item.update({ where: { id }, data: { updatedAt: new Date() } });
            return saved;
          },
          { timeout: 20_000 },
        );
      } catch (error) {
        if (error instanceof ImageUploadError) uploadedKey = error.cleanupKey;
        if (uploadedKey) {
          try {
            await storage.delete(uploadedKey);
          } catch {
            // Если провайдер недоступен, сохраняем задание для фонового повтора.
            try {
              await prisma.imageCleanup.upsert({
                where: { storageKey: uploadedKey },
                create: { storageKey: uploadedKey },
                update: {},
              });
            } catch {
              // При одновременном отказе БД и провайдера нужна сверка объектов.
              console.error('Image cleanup requires reconciliation.', { storageKey: uploadedKey });
            }
          }
        }
        rethrowWriteError(error);
      }
    },

    async deleteImage(ownerId: string, id: string, imageId: string) {
      if (!storage)
        throw new ApiError(
          503,
          'IMAGE_STORAGE_NOT_CONFIGURED',
          'Fotos können derzeit nicht entfernt werden.',
        );
      try {
        const storageKey = await prisma.$transaction(async (tx) => {
          await lockOwnedItem(tx, id, ownerId);
          const image = await tx.itemImage.findFirst({ where: { id: imageId, itemId: id } });
          if (!image) throw new ApiError(404, 'IMAGE_NOT_FOUND', 'Das Foto wurde nicht gefunden.');
          const item = await tx.item.findUniqueOrThrow({
            where: { id },
            select: { isPublished: true },
          });
          if (item.isPublished && (await tx.itemImage.count({ where: { itemId: id } })) === 1) {
            throw new ApiError(
              409,
              'ITEM_IMAGES_REQUIRED',
              'Bitte blende die Anzeige aus, bevor du das letzte Foto entfernst.',
            );
          }
          if (image.storageKey) {
            await tx.imageCleanup.upsert({
              where: { storageKey: image.storageKey },
              create: { storageKey: image.storageKey },
              update: {},
            });
          }
          await tx.itemImage.delete({ where: { id: imageId, itemId: id } });
          const remaining = await tx.itemImage.findMany({
            where: { itemId: id },
            orderBy: { order: 'asc' },
            select: { id: true },
          });
          // После удаления сдвигаем вниз по одному: целевые позиции уже свободны.
          for (const [order, entry] of remaining.entries()) {
            await tx.itemImage.update({ where: { id: entry.id }, data: { order } });
          }
          await tx.item.update({ where: { id }, data: { updatedAt: new Date() } });
          return image.storageKey;
        });
        if (storageKey) {
          try {
            await flushImageCleanup(prisma, storage, storageKey);
          } catch {
            console.warn('Image cleanup will be retried after database recovery.');
          }
        }
      } catch (error) {
        rethrowWriteError(error);
      }
    },

    async reorderImages(ownerId: string, id: string, imageIds: string[]) {
      try {
        const item = await prisma.$transaction(async (tx) => {
          await lockOwnedItem(tx, id, ownerId);
          const images = await tx.itemImage.findMany({
            where: { itemId: id },
            select: { id: true, order: true },
          });
          const currentIds = new Set(images.map((image) => image.id));
          if (
            imageIds.length !== images.length ||
            new Set(imageIds).size !== imageIds.length ||
            imageIds.some((imageId) => !currentIds.has(imageId))
          ) {
            throw new ApiError(
              409,
              'ITEM_IMAGES_CHANGED',
              'Die Fotos haben sich geändert. Bitte lade die Anzeige neu.',
              { images: ['Bitte lade die aktuellen Fotos neu.'] },
            );
          }
          // Сначала свободные позиции выше максимума: прямой обмен 0 ↔ 1
          // нарушил бы UNIQUE(itemId, order). Все записи меняются атомарно.
          const temporaryStart = Math.max(-1, ...images.map((image) => image.order)) + 1;
          for (const [index, imageId] of imageIds.entries()) {
            await tx.itemImage.update({
              where: { id: imageId, itemId: id },
              data: { order: temporaryStart + index },
            });
          }
          for (const [order, imageId] of imageIds.entries()) {
            await tx.itemImage.update({
              where: { id: imageId, itemId: id },
              data: { order },
            });
          }
          return tx.item.update({
            where: { id, ownerId },
            data: { updatedAt: new Date() },
            select: ownerItemSelect,
          });
        });
        return toOwnerItem(item);
      } catch (error) {
        rethrowWriteError(error);
      }
    },

    async create(ownerId: string, data: CreateItemData) {
      try {
        const item = await prisma.$transaction(async (tx) => {
          await requireCategory(tx, data.categoryId);
          return tx.item.create({
            data: { ...data, ownerId, isPublished: false },
            select: ownerItemSelect,
          });
        });
        return toOwnerItem(item);
      } catch (error) {
        rethrowWriteError(error);
      }
    },

    async update(ownerId: string, id: string, data: UpdateItemData) {
      try {
        const item = await prisma.$transaction(async (tx) => {
          await lockOwnedItem(tx, id, ownerId);
          if (data.categoryId) await requireCategory(tx, data.categoryId);
          if (
            data.isPublished === true &&
            (await tx.itemImage.count({ where: { itemId: id } })) === 0
          ) {
            throw new ApiError(
              409,
              'ITEM_IMAGES_REQUIRED',
              'Bitte füge vor dem Veröffentlichen mindestens ein Foto hinzu.',
              {
                images: ['Mindestens ein Foto ist erforderlich.'],
              },
            );
          }
          return tx.item.update({ where: { id, ownerId }, data, select: ownerItemSelect });
        });
        return toOwnerItem(item);
      } catch (error) {
        rethrowWriteError(error);
      }
    },
  };
}
