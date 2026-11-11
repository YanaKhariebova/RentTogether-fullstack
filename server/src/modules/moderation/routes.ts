import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { PrismaClient, ReportStatus } from '../../generated/prisma/client.js';
import { ApiError } from '../../lib/errors.js';
import { requireModerator } from '../../middleware/requireAuth.js';
import { itemParamsSchema } from '../items/schemas.js';
import type { ImageStorage } from '../items/storage/ImageStorage.js';
import { flushImageCleanup } from '../items/imageCleanup.js';
import { createReportSchema, reportParamsSchema, reportStatusSchema } from './schemas.js';

type ModerationDatabase = Pick<
  PrismaClient,
  'item' | 'imageCleanup' | 'itemReport' | 'booking' | '$transaction'
>;

const reportSelect = {
  id: true,
  reason: true,
  details: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  item: { select: { id: true, title: true, isPublished: true, moderationRemovedAt: true } },
  reporter: { select: { id: true, name: true, email: true } },
} as const;

function serializeReport(report: {
  id: string;
  reason: string;
  details: string;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
  item: { id: string; title: string; isPublished: boolean; moderationRemovedAt: Date | null };
  reporter: { id: string; name: string; email: string };
}) {
  return {
    ...report,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    item: {
      ...report.item,
      moderationRemovedAt: report.item.moderationRemovedAt?.toISOString() ?? null,
    },
  };
}

export function createItemModerationRoutes(
  prisma: ModerationDatabase,
  authenticate: RequestHandler,
  storage?: ImageStorage,
) {
  const itemReportsRouter = Router();
  const moderationRouter = Router();

  async function deletePermanently(ids: string[]) {
    const keys = await prisma.$transaction(async (tx) => {
      const keys: string[] = [];
      for (const id of ids) {
        const item = await tx.item.findFirst({
          where: { id, moderationRemovedAt: { not: null } },
          select: { id: true, title: true },
        });
        if (!item)
          throw new ApiError(404, 'TRASH_ITEM_NOT_FOUND', 'Die Anzeige ist nicht im Papierkorb.');
        if (await tx.booking.count({ where: { itemId: id } })) {
          throw new ApiError(
            409,
            'ITEM_HAS_BOOKINGS',
            `„${item.title}“ kann nicht endgültig gelöscht werden, da Buchungen erhalten bleiben müssen.`,
          );
        }
        const images = await tx.item.findUniqueOrThrow({
          where: { id },
          select: { images: { select: { storageKey: true } } },
        });
        for (const { storageKey } of images.images) {
          if (!storageKey) continue;
          keys.push(storageKey);
          await tx.imageCleanup.upsert({
            where: { storageKey },
            create: { storageKey },
            update: {},
          });
        }
        await tx.item.delete({ where: { id } });
      }
      return keys;
    });
    if (storage) {
      for (const key of keys) {
        try {
          await flushImageCleanup(prisma, storage, key);
        } catch {
          // The durable cleanup job keeps the file deletion retryable after a storage failure.
          console.warn('Image cleanup will be retried after database recovery.');
        }
      }
    }
  }

  itemReportsRouter.post('/:id/reports', authenticate, async (req, res) => {
    const { id: itemId } = itemParamsSchema.parse(req.params);
    const data = createReportSchema.parse(req.body);
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { ownerId: true, isPublished: true },
    });
    if (!item || !item.isPublished)
      throw new ApiError(404, 'ITEM_NOT_FOUND', 'Die Anzeige wurde nicht gefunden.');
    if (item.ownerId === res.locals.currentUser.id)
      throw new ApiError(400, 'OWN_ITEM_REPORT', 'Du kannst deine eigene Anzeige nicht melden.');

    const existing = await prisma.itemReport.findUnique({
      where: { itemId_reporterId: { itemId, reporterId: res.locals.currentUser.id } },
      select: { id: true },
    });
    if (existing)
      throw new ApiError(409, 'ALREADY_REPORTED', 'Du hast diese Anzeige bereits gemeldet.');

    const report = await prisma.itemReport.create({
      data: { itemId, reporterId: res.locals.currentUser.id, ...data },
      select: reportSelect,
    });
    res.status(201).json({ report: serializeReport(report) });
  });

  moderationRouter.use(authenticate, (_req, res, next) => {
    requireModerator(res.locals.currentUser);
    next();
  });

  moderationRouter.get('/reports', async (req, res) => {
    const status = reportStatusSchema.optional().parse(req.query.status);
    const reports = await prisma.itemReport.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'asc' },
      select: reportSelect,
    });
    res.json({ reports: reports.map(serializeReport) });
  });

  moderationRouter.get('/trash', async (_req, res) => {
    const items = await prisma.item.findMany({
      where: { moderationRemovedAt: { not: null } },
      select: { id: true, title: true, moderationRemovedAt: true },
      orderBy: { moderationRemovedAt: 'desc' },
    });
    res.json({
      items: items.map((item) => ({
        ...item,
        moderationRemovedAt: item.moderationRemovedAt!.toISOString(),
      })),
    });
  });

  moderationRouter.patch('/reports/:reportId', async (req, res) => {
    const { reportId } = reportParamsSchema.parse(req.params);
    const status = reportStatusSchema.parse(req.body.status);
    const report = await prisma.$transaction(async (tx) => {
      const updated = await tx.itemReport.update({
        where: { id: reportId },
        data: { status },
        select: reportSelect,
      });
      // An item restored from the moderation queue becomes public only after its report is dismissed.
      if (status === 'DISMISSED') {
        await tx.item.updateMany({
          where: { id: updated.item.id, isPublished: false, moderationRemovedAt: null },
          data: { isPublished: true },
        });
      }
      return updated;
    });
    res.json({ report: serializeReport(report) });
  });

  moderationRouter.post('/reports/:reportId/hide-item', async (req, res) => {
    const { reportId } = reportParamsSchema.parse(req.params);
    const report = await prisma.$transaction(async (tx) => {
      const current = await tx.itemReport.findUnique({
        where: { id: reportId },
        select: { itemId: true },
      });
      if (!current)
        throw new ApiError(404, 'REPORT_NOT_FOUND', 'Die Meldung wurde nicht gefunden.');
      await tx.item.update({
        where: { id: current.itemId },
        data: { isPublished: false, moderationRemovedAt: new Date() },
      });
      return tx.itemReport.update({
        where: { id: reportId },
        data: { status: 'ACTIONED' },
        select: reportSelect,
      });
    });
    res.json({ report: serializeReport(report) });
  });

  moderationRouter.post('/trash/:itemId/restore', async (req, res) => {
    const { id } = itemParamsSchema.parse({ id: req.params.itemId });
    const item = await prisma.item.findFirst({
      where: { id, moderationRemovedAt: { not: null } },
      select: { id: true },
    });
    if (!item)
      throw new ApiError(404, 'TRASH_ITEM_NOT_FOUND', 'Die Anzeige ist nicht im Papierkorb.');
    await prisma.$transaction(async (tx) => {
      await tx.item.update({
        where: { id },
        data: { isPublished: false, moderationRemovedAt: null },
      });
      await tx.itemReport.updateMany({
        where: { itemId: id, status: 'ACTIONED' },
        data: { status: 'OPEN' },
      });
    });
    res.status(204).end();
  });

  moderationRouter.delete('/trash/:itemId/permanent', async (req, res) => {
    const { id } = itemParamsSchema.parse({ id: req.params.itemId });
    await deletePermanently([id]);
    res.status(204).end();
  });

  moderationRouter.delete('/trash/permanent', async (_req, res) => {
    const items = await prisma.item.findMany({
      where: { moderationRemovedAt: { not: null } },
      select: { id: true },
    });
    await deletePermanently(items.map((item) => item.id));
    res.status(204).end();
  });

  return { itemReportsRouter, moderationRouter };
}
