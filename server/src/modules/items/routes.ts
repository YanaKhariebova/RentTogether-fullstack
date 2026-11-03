import express, { Router } from 'express';
import { ApiError } from '../../lib/errors.js';
import { createLocationService } from '../locations/service.js';
import type { LocationService } from '../locations/service.js';
import { validateImage, MAX_IMAGE_BYTES } from './imageValidation.js';
import type { ImageStorage } from './storage/ImageStorage.js';
import type { RequestHandler } from 'express';
import {
  createItemSchema,
  itemParamsSchema,
  publicItemsQuerySchema,
  updateItemSchema,
  reorderImagesSchema,
} from './schemas.js';
import { createItemsService } from './service.js';
import type { ItemsDatabase } from './service.js';

export function createItemsRoutes(
  prisma: ItemsDatabase,
  authenticate: RequestHandler,
  storage?: ImageStorage,
  locations: LocationService = createLocationService(),
) {
  const service = createItemsService(prisma, storage);
  const itemsRouter = Router();
  const myRouter = Router();

  // Публичные GET Яны: только опубликованные объявления.
  itemsRouter.get('/', async (req, res) => {
    res.json(await service.listPublished(publicItemsQuerySchema.parse(req.query)));
  });
  itemsRouter.get('/cities', async (_req, res) => {
    res.json({ cities: await service.listPublishedCities() });
  });

  itemsRouter.get('/:id', async (req, res) => {
    const { id } = itemParamsSchema.parse(req.params);
    res.json({ item: await service.getPublished(id) });
  });

  // Auth на отдельных методах: публичные GET Яны в /api/items остаются независимыми.
  itemsRouter.post('/', authenticate, async (req, res) => {
    const data = createItemSchema.parse(req.body);
    data.city = await locations.normalize(data.city);
    const item = await service.create(res.locals.currentUser.id, data);
    res.status(201).json({ item });
  });

  itemsRouter.patch('/:id', authenticate, async (req, res) => {
    const { id } = itemParamsSchema.parse(req.params);
    const data = updateItemSchema.parse(req.body);
    if (data.city !== undefined) {
      const current = await prisma.item.findFirst({
        where: { id, ownerId: res.locals.currentUser.id },
        select: { city: true },
      });
      if (!current) throw new ApiError(404, 'ITEM_NOT_FOUND', 'Die Anzeige wurde nicht gefunden.');
      // Old saved locations can stay unchanged; changing a city requires validation.
      if (data.city !== current.city) data.city = await locations.normalize(data.city);
    }
    const item = await service.update(res.locals.currentUser.id, id, data);
    res.json({ item });
  });

  itemsRouter.patch('/:id/images/order', authenticate, async (req, res) => {
    const { id } = itemParamsSchema.parse(req.params);
    const { imageIds } = reorderImagesSchema.parse(req.body);
    const item = await service.reorderImages(res.locals.currentUser.id, id, imageIds);
    res.json({ item });
  });

  // Совместимость с PUT из прототипа Яны: тот же сервис и валидация, ответ 204.
  itemsRouter.put('/:id/images/order', authenticate, async (req, res) => {
    const { id } = itemParamsSchema.parse(req.params);
    const { imageIds } = reorderImagesSchema.parse(req.body);
    await service.reorderImages(res.locals.currentUser.id, id, imageIds);
    res.status(204).end();
  });

  itemsRouter.post(
    '/:id/images',
    authenticate,
    async (req, _res, next) => {
      const { id } = itemParamsSchema.parse(req.params);
      // Чужой пользователь не запускает декодирование и запись файла.
      await service.assertOwner(_res.locals.currentUser.id, id);
      next();
    },
    express.raw({ type: () => true, limit: MAX_IMAGE_BYTES }),
    async (req, res) => {
      const { id } = itemParamsSchema.parse(req.params);
      const image = await validateImage(req.body, req.get('content-type'));
      const saved = await service.uploadImage(res.locals.currentUser.id, id, image);
      res.status(201).json({ image: saved });
    },
  );

  itemsRouter.delete('/:id/images/:imageId', authenticate, async (req, res) => {
    const { id } = itemParamsSchema.parse(req.params);
    const imageId = itemParamsSchema.parse({ id: req.params.imageId }).id;
    await service.deleteImage(res.locals.currentUser.id, id, imageId);
    res.status(204).end();
  });

  itemsRouter.delete('/:id/permanent', authenticate, async (req, res) => {
    const { id } = itemParamsSchema.parse(req.params);
    await service.deletePermanently(res.locals.currentUser.id, id);
    res.status(204).end();
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
