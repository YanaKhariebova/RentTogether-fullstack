import { z } from 'zod';

export const createReportSchema = z.strictObject({
  reason: z.string().trim().min(1, 'Bitte wähle einen Grund.').max(80),
  details: z.string().trim().max(500).default(''),
});

export const reportParamsSchema = z.strictObject({ reportId: z.uuid() });

export const reportStatusSchema = z.enum(['OPEN', 'REVIEWED', 'DISMISSED', 'ACTIONED']);
