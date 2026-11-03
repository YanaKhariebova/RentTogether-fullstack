import { Prisma } from '../../generated/prisma/client.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { ApiError } from '../../lib/errors.js';

export type MessagesDatabase = Pick<
  PrismaClient,
  'booking' | 'conversation' | 'hiddenConversation' | 'item' | 'message' | '$transaction'
>;

const writableStatuses = ['PENDING', 'APPROVED', 'ACTIVE'];
const messageSelect = {
  id: true,
  senderId: true,
  body: true,
  createdAt: true,
  readAt: true,
  editedAt: true,
  replyTo: { select: { id: true, senderId: true, body: true } },
} satisfies Prisma.MessageSelect;
const conversationSelect = {
  id: true,
  kind: true,
  bookingId: true,
  itemId: true,
  participantId: true,
  updatedAt: true,
  booking: { select: { renterId: true, status: true } },
  item: {
    select: {
      ownerId: true,
      title: true,
      isPublished: true,
      owner: { select: { id: true, name: true, avatarUrl: true } },
    },
  },
  participant: { select: { id: true, name: true, avatarUrl: true } },
} satisfies Prisma.ConversationSelect;
type SelectedConversation = Prisma.ConversationGetPayload<{ select: typeof conversationSelect }>;
type SelectedMessage = Prisma.MessageGetPayload<{ select: typeof messageSelect }>;
const toPublicMessage = (m: SelectedMessage) => ({
  id: m.id,
  senderId: m.senderId,
  body: m.body,
  createdAt: m.createdAt.toISOString(),
  readAt: m.readAt?.toISOString() ?? null,
  editedAt: m.editedAt?.toISOString() ?? null,
  replyTo: m.replyTo
    ? { id: m.replyTo.id, senderId: m.replyTo.senderId, body: m.replyTo.body }
    : null,
});
const canEdit = (date: Date) => Date.now() - date.getTime() <= 15 * 60_000;

function assertAccess(c: SelectedConversation, userId: string) {
  const allowed =
    c.kind === 'BOOKING'
      ? !!c.booking && (c.booking.renterId === userId || c.item.ownerId === userId)
      : c.participantId === userId || c.item.ownerId === userId;
  if (!allowed) throw new ApiError(403, 'FORBIDDEN', 'Du darfst diesen Chat nicht öffnen.');
}
function canWrite(c: SelectedConversation) {
  return c.kind === 'BOOKING'
    ? !!c.booking && writableStatuses.includes(c.booking.status)
    : c.item.isPublished;
}

export function createMessagesService(prisma: MessagesDatabase) {
  async function lockConversation(tx: Prisma.TransactionClient, id: string) {
    const ref = await tx.conversation.findUnique({ where: { id }, select: { itemId: true } });
    if (!ref) throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Der Chat wurde nicht gefunden.');
    await tx.$queryRaw(
      Prisma.sql`SELECT "id" FROM "Item" WHERE "id" = ${ref.itemId}::uuid FOR UPDATE`,
    );
    const c = await tx.conversation.findUnique({ where: { id }, select: conversationSelect });
    if (!c) throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Der Chat wurde nicht gefunden.');
    return c;
  }
  async function change(userId: string, conversationId: string, messageId: string, body?: string) {
    return prisma.$transaction(async (tx) => {
      const c = await lockConversation(tx, conversationId);
      assertAccess(c, userId);
      if (!canWrite(c)) throw new ApiError(409, 'CHAT_CLOSED', 'Dieser Chat ist nur lesbar.');
      const m = await tx.message.findFirst({
        where: { id: messageId, conversationId },
        select: { senderId: true, createdAt: true },
      });
      if (!m) throw new ApiError(404, 'MESSAGE_NOT_FOUND', 'Die Nachricht wurde nicht gefunden.');
      if (m.senderId !== userId)
        throw new ApiError(403, 'FORBIDDEN', 'Du darfst nur eigene Nachrichten ändern.');
      if (body === undefined) {
        await tx.message.delete({ where: { id: messageId } });
      } else {
        if (!canEdit(m.createdAt))
          throw new ApiError(
            409,
            'MESSAGE_EDIT_EXPIRED',
            'Diese Nachricht kann nicht mehr bearbeitet werden.',
          );
        await tx.message.update({ where: { id: messageId }, data: { body, editedAt: new Date() } });
      }
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
      return { id: messageId };
    });
  }
  return {
    async createForBooking(userId: string, bookingId: string) {
      return prisma.$transaction(async (tx) => {
        const b = await tx.booking.findUnique({
          where: { id: bookingId },
          select: { id: true, renterId: true, itemId: true, item: { select: { ownerId: true } } },
        });
        if (!b) throw new ApiError(404, 'BOOKING_NOT_FOUND', 'Die Anfrage wurde nicht gefunden.');
        if (b.renterId !== userId && b.item.ownerId !== userId)
          throw new ApiError(403, 'FORBIDDEN', 'Du darfst diesen Chat nicht öffnen.');
        return tx.conversation.upsert({
          where: { bookingId },
          create: { kind: 'BOOKING', bookingId, itemId: b.itemId },
          update: {},
          select: { id: true, bookingId: true, createdAt: true, updatedAt: true },
        });
      });
    },
    async sendItemInquiry(userId: string, itemId: string, body: string) {
      return prisma.$transaction(async (tx) => {
        await tx.$queryRaw(
          Prisma.sql`SELECT "id" FROM "Item" WHERE "id" = ${itemId}::uuid FOR UPDATE`,
        );
        const item = await tx.item.findUnique({
          where: { id: itemId },
          select: { ownerId: true, isPublished: true },
        });
        if (!item || !item.isPublished)
          throw new ApiError(404, 'ITEM_NOT_FOUND', 'Die Anzeige ist nicht verfügbar.');
        if (item.ownerId === userId)
          throw new ApiError(403, 'FORBIDDEN', 'Du kannst dir nicht selbst schreiben.');
        const c = await tx.conversation.upsert({
          where: { itemId_participantId: { itemId, participantId: userId } },
          create: { kind: 'ITEM_INQUIRY', itemId, participantId: userId },
          update: {},
          select: { id: true },
        });
        const message = await tx.message.create({
          data: { conversationId: c.id, senderId: userId, body },
          select: messageSelect,
        });
        await tx.hiddenConversation.deleteMany({
          where: { conversationId: c.id, userId: item.ownerId },
        });
        await tx.conversation.update({ where: { id: c.id }, data: { updatedAt: new Date() } });
        return { conversation: c, message: toPublicMessage(message) };
      });
    },
    async list(userId: string, cursor?: string, limit = 20) {
      const rows = await prisma.conversation.findMany({
        where: {
          hiddenBy: { none: { userId } },
          OR: [
            {
              kind: 'BOOKING',
              booking: { is: { OR: [{ renterId: userId }, { item: { ownerId: userId } }] } },
            },
            {
              kind: 'ITEM_INQUIRY',
              OR: [{ participantId: userId }, { item: { ownerId: userId } }],
            },
          ],
        },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
          ...conversationSelect,
          messages: {
            take: 1,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            select: { body: true, createdAt: true, senderId: true },
          },
          _count: { select: { messages: { where: { senderId: { not: userId }, readAt: null } } } },
        },
      });
      const page = rows.length > limit ? rows.slice(0, limit) : rows;
      return {
        conversations: page.map((c) => {
          const otherParticipant = c.item.ownerId === userId ? c.participant : c.item.owner;
          return {
            id: c.id,
            kind: c.kind,
            bookingId: c.bookingId,
            itemTitle: c.item.title,
            otherParticipantName: otherParticipant?.name ?? 'Kontakt',
            otherParticipantAvatarUrl: otherParticipant?.avatarUrl || null,
            bookingStatus: c.booking?.status ?? null,
            updatedAt: c.updatedAt.toISOString(),
            lastMessage: c.messages[0]
              ? { ...c.messages[0], createdAt: c.messages[0].createdAt.toISOString() }
              : null,
            unreadCount: c._count.messages,
          };
        }),
        nextCursor: rows.length > limit ? (page.at(-1)?.id ?? null) : null,
      };
    },
    async listMessages(userId: string, id: string, cursor?: string, limit = 20) {
      const c = await prisma.conversation.findUnique({ where: { id }, select: conversationSelect });
      if (!c) throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Der Chat wurde nicht gefunden.');
      assertAccess(c, userId);
      const rows = await prisma.message.findMany({
        where: { conversationId: id },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: messageSelect,
      });
      const page = rows.length > limit ? rows.slice(0, limit) : rows;
      return {
        canSend: canWrite(c),
        kind: c.kind,
        messages: page.map(toPublicMessage),
        nextCursor: rows.length > limit ? (page.at(-1)?.id ?? null) : null,
      };
    },
    async send(userId: string, id: string, body: string, replyToMessageId?: string) {
      return prisma.$transaction(async (tx) => {
        const c = await lockConversation(tx, id);
        assertAccess(c, userId);
        if (!canWrite(c)) throw new ApiError(409, 'CHAT_CLOSED', 'Dieser Chat ist nur lesbar.');
        if (
          replyToMessageId &&
          !(await tx.message.findFirst({
            where: { id: replyToMessageId, conversationId: id },
            select: { id: true },
          }))
        )
          throw new ApiError(
            400,
            'MESSAGE_REPLY_INVALID',
            'Die Antwort gehört nicht zu diesem Chat.',
          );
        const m = await tx.message.create({
          data: { conversationId: id, senderId: userId, body, replyToMessageId },
          select: messageSelect,
        });
        const recipientId = c.item.ownerId === userId ? c.participantId : c.item.ownerId;
        if (recipientId)
          await tx.hiddenConversation.deleteMany({
            where: { conversationId: id, userId: recipientId },
          });
        await tx.conversation.update({ where: { id }, data: { updatedAt: new Date() } });
        return toPublicMessage(m);
      });
    },
    async edit(userId: string, id: string, messageId: string, body: string) {
      await change(userId, id, messageId, body);
      const m = await prisma.message.findUnique({
        where: { id: messageId },
        select: messageSelect,
      });
      return m ? toPublicMessage(m) : null;
    },
    async remove(userId: string, id: string, messageId: string) {
      return change(userId, id, messageId);
    },
    async hide(userId: string, id: string) {
      const c = await prisma.conversation.findUnique({ where: { id }, select: conversationSelect });
      if (!c) throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Der Chat wurde nicht gefunden.');
      assertAccess(c, userId);
      await prisma.hiddenConversation.upsert({
        where: { conversationId_userId: { conversationId: id, userId } },
        create: { conversationId: id, userId },
        update: {},
      });
    },
    async markRead(userId: string, id: string, lastReadMessageId: string) {
      const c = await prisma.conversation.findUnique({ where: { id }, select: conversationSelect });
      if (!c) throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Der Chat wurde nicht gefunden.');
      assertAccess(c, userId);
      const last = await prisma.message.findFirst({
        where: { id: lastReadMessageId, conversationId: id },
        select: { id: true, createdAt: true },
      });
      if (!last)
        throw new ApiError(404, 'MESSAGE_NOT_FOUND', 'Die Nachricht wurde nicht gefunden.');
      await prisma.message.updateMany({
        where: {
          conversationId: id,
          senderId: { not: userId },
          readAt: null,
          OR: [
            { createdAt: { lt: last.createdAt } },
            { createdAt: last.createdAt, id: { lte: last.id } },
          ],
        },
        data: { readAt: new Date() },
      });
    },
    async unreadCount(userId: string) {
      return prisma.message.count({
        where: {
          senderId: { not: userId },
          readAt: null,
          conversation: {
            hiddenBy: { none: { userId } },
            OR: [
              {
                kind: 'BOOKING',
                booking: { is: { OR: [{ renterId: userId }, { item: { ownerId: userId } }] } },
              },
              {
                kind: 'ITEM_INQUIRY',
                OR: [{ participantId: userId }, { item: { ownerId: userId } }],
              },
            ],
          },
        },
      });
    },
  };
}
