import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { PrismaClient, ReportStatus } from '../../generated/prisma/client.js';
import { ApiError } from '../../lib/errors.js';
import { requireModerator } from '../../middleware/requireAuth.js';
import { itemParamsSchema } from '../items/schemas.js';
import { createReportSchema, reportParamsSchema, reportStatusSchema } from './schemas.js';

type ModerationDatabase = Pick<PrismaClient, 'item' | 'itemReport' | '$transaction'>;

const reportSelect = {
  id: true,
  reason: true,
  details: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  item: { select: { id: true, title: true, isPublished: true } },
  reporter: { select: { id: true, name: true, email: true } },
} as const;

function serializeReport(report: {
  id: string;
  reason: string;
  details: string;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
  item: { id: string; title: string; isPublished: boolean };
  reporter: { id: string; name: string; email: string };
}) {
  return {
    ...report,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

export function createItemModerationRoutes(
  prisma: ModerationDatabase,
  authenticate: RequestHandler,
) {
  const itemReportsRouter = Router();
  const moderationRouter = Router();

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

  moderationRouter.patch('/reports/:reportId', async (req, res) => {
    const { reportId } = reportParamsSchema.parse(req.params);
    const status = reportStatusSchema.parse(req.body.status);
    const report = await prisma.itemReport.update({
      where: { id: reportId },
      data: { status },
      select: reportSelect,
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
      await tx.item.update({ where: { id: current.itemId }, data: { isPublished: false } });
      return tx.itemReport.update({
        where: { id: reportId },
        data: { status: 'ACTIONED' },
        select: reportSelect,
      });
    });
    res.json({ report: serializeReport(report) });
  });

  return { itemReportsRouter, moderationRouter };
}
