import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseNotificationCount, parseNotificationsPage } from './notificationDto.ts';

const notification = {
  id: '10000000-0000-4000-8000-000000000001',
  type: 'BOOKING_REQUEST_CREATED',
  createdAt: '2026-11-03T10:00:00.000Z',
  readAt: null,
  booking: {
    id: '20000000-0000-4000-8000-000000000001',
    status: 'PENDING',
    item: { id: '30000000-0000-4000-8000-000000000001', title: 'Akku-Bohrschrauber' },
  },
};

test('notification adapter accepts the nested DTO published by Yana and preserves cursor and read state', () => {
  const result = parseNotificationsPage({
    notifications: [notification],
    nextCursor: notification.id,
  });
  assert.equal(result.nextCursor, notification.id);
  assert.equal(result.notifications[0].bookingId, notification.booking.id);
  assert.equal(result.notifications[0].itemTitle, 'Akku-Bohrschrauber');
  assert.equal(result.notifications[0].readAt, null);
  const readAt = '2026-11-03T11:00:00.000Z';
  assert.equal(
    parseNotificationsPage({ notifications: [{ ...notification, readAt }], nextCursor: null })
      .notifications[0].readAt,
    readAt,
  );
});

test('an invalid or changed response is an error, never an empty inbox or zero unread', () => {
  for (const value of [null, {}, { count: 2 }, { unreadCount: -1 }, { unreadCount: 1.5 }]) {
    assert.throws(() => parseNotificationCount(value));
  }
  assert.deepEqual(parseNotificationCount({ unreadCount: 0 }), { unreadCount: 0 });
  assert.deepEqual(parseNotificationCount({ unreadCount: 120 }), { unreadCount: 120 });
  assert.throws(() => parseNotificationsPage({ items: [], nextCursor: null }));
  assert.throws(() =>
    parseNotificationsPage({
      notifications: [{ ...notification, type: 'UNKNOWN_EVENT' }],
      nextCursor: null,
    }),
  );
  assert.throws(() =>
    parseNotificationsPage({
      notifications: [{ ...notification, booking: null }],
      nextCursor: null,
    }),
  );
});
