import cors from 'cors';
import { createLocationService } from './modules/locations/service.js';
import type { LocationService } from './modules/locations/service.js';
import { createLocationRoutes } from './modules/locations/routes.js';
import type { ImageStorage } from './modules/items/storage/ImageStorage.js';
import express from 'express';
import type { RequestHandler } from 'express';
import type { PrismaClient } from './generated/prisma/client.js';
import { ApiError, errorHandler } from './lib/errors.js';
import { profilePatchSchema, toCurrentUser } from './modules/users/profile.js';
import { createItemsRoutes } from './modules/items/routes.js';
import { createItemModerationRoutes } from './modules/moderation/routes.js';
import { createBookingsRoutes } from './modules/bookings/routes.js';
import { createFavoritesRoutes } from './modules/favorites/routes.js';
import { createNotificationsRoutes } from './modules/notifications/routes.js';
import {
  createBookingConversationRoutes,
  createItemInquiryRoutes,
  createMessagesRoutes,
} from './modules/messages/routes.js';

export function createApp(deps: {
  prisma: Pick<
    PrismaClient,
    | 'user'
    | 'category'
    | 'item'
    | 'booking'
    | 'favorite'
    | 'hiddenConversation'
    | 'notification'
    | 'conversation'
    | 'message'
    | '$transaction'
    | 'imageCleanup'
    | 'itemReport'
  >;
  authenticate: RequestHandler;
  authMiddleware?: RequestHandler;
  clientUrl?: string;
  imageStorage?: ImageStorage;
  localUploadsDirectory?: string;
  locationService?: LocationService;
}) {
  const app = express();
  const locations = deps.locationService ?? createLocationService();
  app.disable('x-powered-by');
  app.use(cors({ origin: deps.clientUrl ?? 'http://localhost:5173' }));
  app.use(express.json({ limit: '32kb' }));
  if (deps.localUploadsDirectory) {
    app.use(
      '/uploads',
      express.static(deps.localUploadsDirectory, {
        dotfiles: 'deny',
        index: false,
        setHeaders: (res) => {
          res.setHeader('X-Content-Type-Options', 'nosniff');
        },
      }),
    );
  }
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/locations', createLocationRoutes(locations));
  app.get('/api/categories', async (_req, res) => {
    const categories = await deps.prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    res.json({ categories });
  });
  if (deps.authMiddleware) app.use('/api', deps.authMiddleware);
  app.get('/api/me', deps.authenticate, (_req, res) => {
    res.json({ user: toCurrentUser(res.locals.currentUser) });
  });
  app.patch('/api/me', deps.authenticate, async (req, res) => {
    const data = profilePatchSchema.parse(req.body);
    const user = await deps.prisma.user.update({ where: { id: res.locals.currentUser.id }, data });
    res.json({ user: toCurrentUser(user) });
  });
  const { itemsRouter, myRouter } = createItemsRoutes(
    deps.prisma,
    deps.authenticate,
    deps.imageStorage,
    locations,
  );
  app.use('/api/items', itemsRouter);
  const { itemReportsRouter, moderationRouter } = createItemModerationRoutes(
    deps.prisma,
    deps.authenticate,
    deps.imageStorage,
  );
  app.use('/api/items', itemReportsRouter);
  app.use('/api/items', createItemInquiryRoutes(deps.prisma, deps.authenticate));
  app.use('/api/my', myRouter);
  app.use('/api/bookings', createBookingsRoutes(deps.prisma, deps.authenticate));
  app.use('/api/bookings', createBookingConversationRoutes(deps.prisma, deps.authenticate));
  app.use('/api/me/favorites', createFavoritesRoutes(deps.prisma, deps.authenticate));
  app.use('/api/me/notifications', createNotificationsRoutes(deps.prisma, deps.authenticate));
  app.use('/api/conversations', createMessagesRoutes(deps.prisma, deps.authenticate));
  app.use('/api/moderation', moderationRouter);
  app.use((_req, _res) => {
    throw new ApiError(404, 'NOT_FOUND', 'Die Seite wurde nicht gefunden.');
  });
  app.use(errorHandler);
  return app;
}
