import { Prisma } from '../../generated/prisma/client.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { ApiError } from '../../lib/errors.js';

export type FavoritesDatabase = Pick<PrismaClient, 'favorite' | 'item'>;

const favoriteItemSelect = {
  id: true,
  title: true,
  description: true,
  city: true,
  pricePerDay: true,
  isPublished: true,
  category: { select: { id: true, name: true } },
  owner: { select: { id: true, name: true, city: true } },
  images: { select: { id: true, url: true, order: true }, orderBy: { order: 'asc' } },
} satisfies Prisma.ItemSelect;

type FavoriteItem = Prisma.ItemGetPayload<{ select: typeof favoriteItemSelect }>;

function toPublicItem(item: FavoriteItem) {
  return {
    ...item,
    pricePerDay: item.pricePerDay.toFixed(2),
  };
}

export function createFavoritesService(prisma: FavoritesDatabase) {
  return {
    async add(userId: string, itemId: string) {
      const item = await prisma.item.findFirst({
        where: { id: itemId, isPublished: true },
        select: { id: true },
      });
      if (!item) throw new ApiError(404, 'ITEM_NOT_FOUND', 'Die Anzeige wurde nicht gefunden.');

      return prisma.favorite.upsert({
        where: { userId_itemId: { userId, itemId } },
        create: { userId, itemId },
        update: {},
        select: { id: true, itemId: true, createdAt: true },
      });
    },

    async remove(userId: string, itemId: string) {
      await prisma.favorite.deleteMany({ where: { userId, itemId } });
    },

    async list(userId: string) {
      const favorites = await prisma.favorite.findMany({
        where: { userId, item: { isPublished: true } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: { item: { select: favoriteItemSelect } },
      });
      return favorites.map((favorite) => toPublicItem(favorite.item));
    },
  };
}
