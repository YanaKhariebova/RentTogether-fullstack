import { Prisma } from '../../generated/prisma/client.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { ApiError } from '../../lib/errors.js';
import { requireOwner } from '../../middleware/requireAuth.js';
import type { CreateItemData, UpdateItemData } from './schemas.js';

export type ItemsDatabase = Pick<PrismaClient, 'item' | 'category' | '$transaction'>;

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

export function createItemsService(prisma: ItemsDatabase) {
  return {
    async listMine(ownerId: string) {
      const items = await prisma.item.findMany({
        where: { ownerId },
        select: ownerItemSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      });
      return items.map(toOwnerItem);
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

    async addImage(ownerId: string, id: string, image: { url: string; storageKey: string }) {
      return prisma.$transaction(async (tx) => {
        await lockOwnedItem(tx, id, ownerId);
        const { _max } = await tx.itemImage.aggregate({ where: { itemId: id }, _max: { order: true } });
        return tx.itemImage.create({
          data: { itemId: id, ...image, order: (_max.order ?? -1) + 1 },
          select: { id: true, url: true, order: true },
        });
      });
    },

    async deleteImage(ownerId: string, itemId: string, imageId: string) {
      return prisma.$transaction(async (tx) => {
        await lockOwnedItem(tx, itemId, ownerId);
        const image = await tx.itemImage.findFirst({ where: { id: imageId, itemId } });
        if (!image) throw new ApiError(404, 'IMAGE_NOT_FOUND', 'Das Foto wurde nicht gefunden.');
        await tx.itemImage.delete({ where: { id: imageId } });
        const remaining = await tx.itemImage.findMany({ where: { itemId }, orderBy: { order: 'asc' } });
        await Promise.all(remaining.map((entry, order) => tx.itemImage.update({ where: { id: entry.id }, data: { order } })));
        return image.storageKey;
      });
    },

    async reorderImages(ownerId: string, itemId: string, imageIds: string[]) {
      return prisma.$transaction(async (tx) => {
        await lockOwnedItem(tx, itemId, ownerId);
        const images = await tx.itemImage.findMany({ where: { itemId }, select: { id: true } });
        if (images.length !== imageIds.length || new Set(imageIds).size !== imageIds.length || images.some((image) => !imageIds.includes(image.id)))
          throw new ApiError(400, 'INVALID_IMAGE_ORDER', 'Die Reihenfolge der Fotos ist ungültig.');
        await Promise.all(imageIds.map((id, order) => tx.itemImage.update({ where: { id }, data: { order } })));
      });
    },
  };
}
