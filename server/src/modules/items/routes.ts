import { Router } from 'express';
import type { RequestHandler } from 'express';
import { createItemSchema, itemParamsSchema, updateItemSchema } from './schemas.js';
import { createItemsService } from './service.js';
import type { ItemsDatabase } from './service.js';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { MAX_IMAGE_BYTES, imageExtension, removeStoredImage, storeImage } from './imageStorage.js';
import { ApiError } from '../../lib/errors.js';

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

  itemsRouter.post(
    '/:id/images',
    authenticate,
    express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: MAX_IMAGE_BYTES }),
    async (req, res) => {
      const { id } = itemParamsSchema.parse(req.params);
      const contentType = req.headers['content-type'];
      const extension = imageExtension(Array.isArray(contentType) ? contentType[0] : contentType);
      if (!extension || !Buffer.isBuffer(req.body) || req.body.length === 0)
        throw new ApiError(400, 'INVALID_IMAGE', 'Bitte lade ein JPEG-, PNG- oder WebP-Bild hoch.');
      const storageKey = `${randomUUID()}.${extension}`;
      await storeImage(storageKey, req.body);
      try {
        const url = `${req.protocol}://${req.get('host')}/uploads/${storageKey}`;
        const image = await service.addImage(res.locals.currentUser.id, id, { url, storageKey });
        res.status(201).json({ image });
      } catch (error) {
        await removeStoredImage(storageKey);
        throw error;
      }
    },
  );

  itemsRouter.delete('/:id/images/:imageId', authenticate, async (req, res) => {
    const { id } = itemParamsSchema.parse(req.params);
    const imageId = itemParamsSchema.parse({ id: req.params.imageId }).id;
    const storageKey = await service.deleteImage(res.locals.currentUser.id, id, imageId);
    await removeStoredImage(storageKey);
    res.status(204).end();
  });

  itemsRouter.put('/:id/images/order', authenticate, async (req, res) => {
    const { id } = itemParamsSchema.parse(req.params);
    const imageIds = req.body?.imageIds;
    if (!Array.isArray(imageIds) || !imageIds.every((value) => typeof value === 'string'))
      throw new ApiError(400, 'INVALID_IMAGE_ORDER', 'Die Reihenfolge der Fotos ist ungültig.');
    await service.reorderImages(res.locals.currentUser.id, id, imageIds);
    res.status(204).end();
  });

  myRouter.get('/items', authenticate, async (_req, res) => {
    res.json({ items: await service.listMine(res.locals.currentUser.id) });
  });

  return { itemsRouter, myRouter };
}
