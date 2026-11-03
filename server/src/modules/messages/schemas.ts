import { z } from 'zod';

const uuid = z.uuid('Ungültige ID.');

export const conversationParamsSchema = z.object({ id: uuid });
export const messageParamsSchema = z.object({ id: uuid, messageId: uuid });
export const bookingConversationParamsSchema = z.object({ bookingId: uuid });
export const itemConversationParamsSchema = z.object({ itemId: uuid });
export const pageQuerySchema = z.object({
  cursor: uuid.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export const messageBodySchema = z.strictObject({
  body: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length >= 1 && value.length <= 2000, {
      message: 'Eine Nachricht muss zwischen 1 und 2000 Zeichen lang sein.',
    }),
  replyToMessageId: uuid.optional(),
});
export const markReadSchema = z.strictObject({ lastReadMessageId: uuid });
