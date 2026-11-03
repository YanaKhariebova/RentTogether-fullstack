import { z } from 'zod';

export const notificationIdsSchema = z.strictObject({
  ids: z.array(z.uuid('Ungültige Benachrichtigungs-ID.')).min(1).max(100),
});

export const notificationListQuerySchema = z.object({
  cursor: z.uuid('Ungültiger Cursor.').optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
