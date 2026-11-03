import { z } from 'zod';

const notificationSchema = z.object({
  id: z.string().uuid(),
  booking: z.object({
    id: z.string().uuid(),
    status: z.string(),
    item: z.object({ id: z.string().uuid(), title: z.string() }),
  }),
  type: z.enum([
    'BOOKING_REQUEST_CREATED',
    'BOOKING_APPROVED',
    'BOOKING_REJECTED',
    'BOOKING_CANCELLED',
    'BOOKING_ACTIVE',
    'BOOKING_COMPLETED',
  ]),
  createdAt: z.string().datetime({ offset: true }),
  readAt: z.string().datetime({ offset: true }).nullable(),
});
// Matches Yana's notifications service (6251ff5); no second backend model.
const pageSchema = z
  .object({
    notifications: z.array(notificationSchema),
    nextCursor: z.string().nullable(),
  })
  .transform((page) => ({
    ...page,
    notifications: page.notifications.map(({ booking, ...notification }) => ({
      ...notification,
      bookingId: booking.id,
      itemTitle: booking.item.title,
    })),
  }));
const countSchema = z.object({ unreadCount: z.number().int().nonnegative() });
export function parseNotificationsPage(value: unknown) {
  return pageSchema.parse(value);
}
export function parseNotificationCount(value: unknown) {
  return countSchema.parse(value);
}
