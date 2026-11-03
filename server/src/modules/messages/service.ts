import { Prisma } from '../../generated/prisma/client.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { ApiError } from '../../lib/errors.js';

export type MessagesDatabase = Pick<
  PrismaClient,
  'booking' | 'conversation' | 'message' | '$transaction'
>;

const participantBookingSelect = {
  id: true,
  renterId: true,
  status: true,
  item: { select: { ownerId: true, title: true } },
} satisfies Prisma.BookingSelect;

function assertParticipant(
  booking: Prisma.BookingGetPayload<{ select: typeof participantBookingSelect }>,
  userId: string,
) {
  if (booking.renterId !== userId && booking.item.ownerId !== userId)
    throw new ApiError(403, 'FORBIDDEN', 'Du darfst diesen Chat nicht öffnen.');
}

export function createMessagesService(prisma: MessagesDatabase) {
  return {
    async createForBooking(userId: string, bookingId: string) {
      return prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          select: participantBookingSelect,
        });
        if (!booking)
          throw new ApiError(404, 'BOOKING_NOT_FOUND', 'Die Anfrage wurde nicht gefunden.');
        assertParticipant(booking, userId);
        return tx.conversation.upsert({
          where: { bookingId },
          create: { bookingId },
          update: {},
          select: { id: true, bookingId: true, createdAt: true, updatedAt: true },
        });
      });
    },

    async list(userId: string, cursor?: string, limit = 20) {
      const conversations = await prisma.conversation.findMany({
        where: { booking: { OR: [{ renterId: userId }, { item: { ownerId: userId } }] } },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
          id: true,
          bookingId: true,
          updatedAt: true,
          booking: {
            select: {
              status: true,
              renter: { select: { id: true, name: true } },
              item: {
                select: { id: true, title: true, owner: { select: { id: true, name: true } } },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            select: { body: true, createdAt: true, senderId: true },
          },
          _count: { select: { messages: { where: { senderId: { not: userId }, readAt: null } } } },
        },
      });
      const hasMore = conversations.length > limit;
      const page = hasMore ? conversations.slice(0, limit) : conversations;
      return {
        conversations: page.map((conversation) => {
          const otherParticipant =
            conversation.booking.renter.id === userId
              ? conversation.booking.item.owner
              : conversation.booking.renter;
          return {
            id: conversation.id,
            bookingId: conversation.bookingId,
            itemTitle: conversation.booking.item.title,
            otherParticipantName: otherParticipant.name,
            bookingStatus: conversation.booking.status,
            updatedAt: conversation.updatedAt.toISOString(),
            lastMessage: conversation.messages[0]
              ? {
                  ...conversation.messages[0],
                  createdAt: conversation.messages[0].createdAt.toISOString(),
                }
              : null,
            unreadCount: conversation._count.messages,
          };
        }),
        nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
      };
    },

    async listMessages(userId: string, conversationId: string, cursor?: string, limit = 20) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { booking: { select: participantBookingSelect } },
      });
      if (!conversation)
        throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Der Chat wurde nicht gefunden.');
      assertParticipant(conversation.booking, userId);
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: { id: true, senderId: true, body: true, createdAt: true, readAt: true },
      });
      const hasMore = messages.length > limit;
      const page = hasMore ? messages.slice(0, limit) : messages;
      return {
        canSend: ['PENDING', 'APPROVED', 'ACTIVE'].includes(conversation.booking.status),
        messages: page.map((message) => ({
          ...message,
          createdAt: message.createdAt.toISOString(),
          readAt: message.readAt?.toISOString() ?? null,
        })),
        nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
      };
    },

    async send(userId: string, conversationId: string, body: string) {
      return prisma.$transaction(async (tx) => {
        let conversation = await tx.conversation.findUnique({
          where: { id: conversationId },
          select: { bookingId: true },
        });
        if (!conversation)
          throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Der Chat wurde nicht gefunden.');
        await tx.$queryRaw(
          Prisma.sql`SELECT "id" FROM "Item" WHERE "id" = (SELECT "itemId" FROM "Booking" WHERE "id" = ${conversation.bookingId}::uuid) FOR UPDATE`,
        );
        conversation = await tx.conversation.findUnique({
          where: { id: conversationId },
          select: { bookingId: true },
        });
        if (!conversation)
          throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Der Chat wurde nicht gefunden.');
        const booking = await tx.booking.findUnique({
          where: { id: conversation.bookingId },
          select: participantBookingSelect,
        });
        if (!booking)
          throw new ApiError(404, 'BOOKING_NOT_FOUND', 'Die Anfrage wurde nicht gefunden.');
        assertParticipant(booking, userId);
        if (!['PENDING', 'APPROVED', 'ACTIVE'].includes(booking.status))
          throw new ApiError(
            409,
            'CHAT_CLOSED',
            'Für diese abgeschlossene Anfrage sind keine neuen Nachrichten möglich.',
          );
        const message = await tx.message.create({
          data: { conversationId, senderId: userId, body },
          select: { id: true, senderId: true, body: true, createdAt: true, readAt: true },
        });
        await tx.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
        return { ...message, createdAt: message.createdAt.toISOString(), readAt: null };
      });
    },

    async markRead(userId: string, conversationId: string, lastReadMessageId: string) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { booking: { select: participantBookingSelect } },
      });
      if (!conversation)
        throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Der Chat wurde nicht gefunden.');
      assertParticipant(conversation.booking, userId);
      const lastMessage = await prisma.message.findFirst({
        where: { id: lastReadMessageId, conversationId },
        select: { id: true, createdAt: true },
      });
      if (!lastMessage)
        throw new ApiError(404, 'MESSAGE_NOT_FOUND', 'Die Nachricht wurde nicht gefunden.');
      await prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          readAt: null,
          OR: [
            { createdAt: { lt: lastMessage.createdAt } },
            { createdAt: lastMessage.createdAt, id: { lte: lastMessage.id } },
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
          conversation: { booking: { OR: [{ renterId: userId }, { item: { ownerId: userId } }] } },
        },
      });
    },
  };
}
