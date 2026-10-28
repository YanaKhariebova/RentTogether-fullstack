import { Router } from 'express';
import type { RequestHandler } from 'express';
import { createItemSchema, itemParamsSchema, updateItemSchema } from './schemas.js';
import { createItemsService } from './service.js';
import type { ItemsDatabase } from './service.js';

export function createItemsRoutes(prisma: ItemsDatabase, authenticate: RequestHandler) {
  const service = createItemsService(prisma);
  const itemsRouter = Router();
  const myRouter = Router();

  // Auth на отдельных методах: публичные GET Яны в /api/items остаются независимыми.
  itemsRouter.post('/', authenticate, async (req, res) => {
    const item = await service.create(res.locals.currentUser.id, createItemSchema.parse(req.body));
    res.status(201).json({ item });
  });

  itemsRouter.patch('/:id', authenticate, async (req, res) => {
    const { id } = itemParamsSchema.parse(req.params);
    const item = await service.update(
      res.locals.currentUser.id,
      id,
      updateItemSchema.parse(req.body),
    );
    res.json({ item });
  });

  // DELETE снимает с публикации: вещь, фото и будущие бронирования сохраняются.
  itemsRouter.delete('/:id', authenticate, async (req, res) => {
    const { id } = itemParamsSchema.parse(req.params);
    const item = await service.update(res.locals.currentUser.id, id, { isPublished: false });
    res.json({ item });
  });

  myRouter.get('/items', authenticate, async (_req, res) => {
    res.json({ items: await service.listMine(res.locals.currentUser.id) });
  });

  return { itemsRouter, myRouter };
}
