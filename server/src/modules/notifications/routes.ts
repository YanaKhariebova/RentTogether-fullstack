import { Router } from 'express';
import type { RequestHandler } from 'express';
import { notificationIdsSchema, notificationListQuerySchema } from './schemas.js';
import type { NotificationsDatabase } from './service.js';
import { createNotificationsService } from './service.js';

export function createNotificationsRoutes(
  prisma: NotificationsDatabase,
  authenticate: RequestHandler,
) {
  const router = Router();
  const service = createNotificationsService(prisma);

  router.get('/', authenticate, async (req, res) => {
    const { cursor, limit } = notificationListQuerySchema.parse(req.query);
    res.json(await service.list(res.locals.currentUser.id, cursor, limit));
  });
  router.get('/unread-count', authenticate, async (_req, res) => {
    res.json({ count: await service.unreadCount(res.locals.currentUser.id) });
  });
  router.patch('/read', authenticate, async (req, res) => {
    const { ids } = notificationIdsSchema.parse(req.body);
    await service.markRead(res.locals.currentUser.id, ids);
    res.status(204).end();
  });
  return router;
}
