import { Router } from 'express';
import type { RequestHandler } from 'express';
import {
  bookingConversationParamsSchema,
  conversationParamsSchema,
  itemConversationParamsSchema,
  markReadSchema,
  messageBodySchema,
  messageParamsSchema,
  pageQuerySchema,
} from './schemas.js';
import type { MessagesDatabase } from './service.js';
import { createMessagesService } from './service.js';
import type { MessageEvents } from './events.js';

export function createMessagesRoutes(
  prisma: MessagesDatabase,
  authenticate: RequestHandler,
  events: MessageEvents,
) {
  const router = Router();
  const service = createMessagesService(prisma, events);
  router.get('/events', authenticate, (_req, res) => {
    events.connect(res.locals.currentUser.id, res);
  });
  router.get('/', authenticate, async (req, res) => {
    const { cursor, limit } = pageQuerySchema.parse(req.query);
    res.json(await service.list(res.locals.currentUser.id, cursor, limit));
  });
  router.get('/unread-count', authenticate, async (_req, res) => {
    res.json({ count: await service.unreadCount(res.locals.currentUser.id) });
  });
  router.get('/:id/messages', authenticate, async (req, res) => {
    const { id } = conversationParamsSchema.parse(req.params);
    const { cursor, limit } = pageQuerySchema.parse(req.query);
    res.json(await service.listMessages(res.locals.currentUser.id, id, cursor, limit));
  });
  router.post('/:id/messages', authenticate, async (req, res) => {
    const { id } = conversationParamsSchema.parse(req.params);
    const { body, replyToMessageId } = messageBodySchema.parse(req.body);
    res
      .status(201)
      .json({ message: await service.send(res.locals.currentUser.id, id, body, replyToMessageId) });
  });
  router.patch('/:id/messages/:messageId', authenticate, async (req, res) => {
    const { id, messageId } = messageParamsSchema.parse(req.params);
    const { body } = messageBodySchema.parse(req.body);
    res.json({ message: await service.edit(res.locals.currentUser.id, id, messageId, body) });
  });
  router.delete('/:id/messages/:messageId', authenticate, async (req, res) => {
    const { id, messageId } = messageParamsSchema.parse(req.params);
    res.json({ message: await service.remove(res.locals.currentUser.id, id, messageId) });
  });
  router.delete('/:id', authenticate, async (req, res) => {
    const { id } = conversationParamsSchema.parse(req.params);
    await service.hide(res.locals.currentUser.id, id);
    res.status(204).end();
  });
  router.patch('/:id/read', authenticate, async (req, res) => {
    const { id } = conversationParamsSchema.parse(req.params);
    const { lastReadMessageId } = markReadSchema.parse(req.body);
    await service.markRead(res.locals.currentUser.id, id, lastReadMessageId);
    res.status(204).end();
  });
  return router;
}

export function createBookingConversationRoutes(
  prisma: MessagesDatabase,
  authenticate: RequestHandler,
  events: MessageEvents,
) {
  const router = Router();
  const service = createMessagesService(prisma, events);
  router.post('/:bookingId/conversation', authenticate, async (req, res) => {
    const { bookingId } = bookingConversationParamsSchema.parse(req.params);
    const conversation = await service.createForBooking(res.locals.currentUser.id, bookingId);
    res.status(201).json({
      conversation: {
        ...conversation,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      },
    });
  });
  return router;
}

export function createItemInquiryRoutes(
  prisma: MessagesDatabase,
  authenticate: RequestHandler,
  events: MessageEvents,
) {
  const router = Router();
  const service = createMessagesService(prisma, events);
  router.post('/:itemId/conversation/messages', authenticate, async (req, res) => {
    const { itemId } = itemConversationParamsSchema.parse(req.params);
    const { body } = messageBodySchema.parse(req.body);
    res.status(201).json(await service.sendItemInquiry(res.locals.currentUser.id, itemId, body));
  });
  return router;
}
