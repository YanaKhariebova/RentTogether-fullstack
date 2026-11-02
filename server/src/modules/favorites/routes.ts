import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { FavoritesDatabase } from './service.js';
import { createFavoritesService } from './service.js';
import { favoriteItemParamsSchema } from './schemas.js';

export function createFavoritesRoutes(prisma: FavoritesDatabase, authenticate: RequestHandler) {
  const router = Router();
  const service = createFavoritesService(prisma);

  router.get('/', authenticate, async (_req, res) => {
    res.json({ items: await service.list(res.locals.currentUser.id) });
  });
  router.put('/:itemId', authenticate, async (req, res) => {
    const { id } = favoriteItemParamsSchema.parse({ id: req.params.itemId });
    const favorite = await service.add(res.locals.currentUser.id, id);
    res
      .status(201)
      .json({ favorite: { ...favorite, createdAt: favorite.createdAt.toISOString() } });
  });
  router.delete('/:itemId', authenticate, async (req, res) => {
    const { id } = favoriteItemParamsSchema.parse({ id: req.params.itemId });
    await service.remove(res.locals.currentUser.id, id);
    res.status(204).end();
  });
  return router;
}
