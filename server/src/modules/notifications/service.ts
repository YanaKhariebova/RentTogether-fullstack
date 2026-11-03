import type { PrismaClient } from '../../generated/prisma/client.js';

export type NotificationsDatabase = Pick<PrismaClient, 'notification'>;

export function createNotificationsService(prisma: NotificationsDatabase) {
  return {
    async list(userId: string, cursor?: string, limit = 20) {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
          id: true,
          type: true,
          createdAt: true,
          readAt: true,
          booking: {
            select: { id: true, status: true, item: { select: { id: true, title: true } } },
          },
        },
      });
      const hasMore = notifications.length > limit;
      const page = hasMore ? notifications.slice(0, limit) : notifications;
      return {
        notifications: page.map((notification) => ({
          ...notification,
          createdAt: notification.createdAt.toISOString(),
          readAt: notification.readAt?.toISOString() ?? null,
        })),
        nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
      };
    },

    async unreadCount(userId: string) {
      return prisma.notification.count({ where: { userId, readAt: null } });
    },

    async markRead(userId: string, ids: string[]) {
      await prisma.notification.updateMany({
        where: { userId, id: { in: ids }, readAt: null },
        data: { readAt: new Date() },
      });
    },
  };
}
