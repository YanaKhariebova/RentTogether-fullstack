import cors from 'cors';
import express from 'express';
import type { RequestHandler } from 'express';
import type { PrismaClient } from './generated/prisma/client.js';
import { ApiError, errorHandler } from './lib/errors.js';
import { profilePatchSchema, toCurrentUser } from './modules/users/profile.js';

export function createApp(deps: {
  prisma: Pick<PrismaClient, 'user' | 'category'>;
  authenticate: RequestHandler;
  authMiddleware?: RequestHandler;
  clientUrl?: string;
}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: deps.clientUrl ?? 'http://localhost:5173' }));
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
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
  app.use((_req, _res) => {
    throw new ApiError(404, 'NOT_FOUND', 'Die Seite wurde nicht gefunden.');
  });
  app.use(errorHandler);
  return app;
}
