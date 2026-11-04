import assert from 'node:assert/strict';
import test from 'node:test';
import { orderConversations, shouldPlayMessageTone } from './conversationPresentation.ts';

const conversation = (id, unreadCount, updatedAt) => ({
  id,
  kind: 'BOOKING',
  bookingId: 'booking-id',
  itemTitle: 'Kinderwagen',
  otherParticipantName: 'Katya',
  otherParticipantAvatarUrl: null,
  bookingStatus: 'PENDING',
  lastMessage: null,
  unreadCount,
  updatedAt,
});

test('unread conversations come first, then newest conversations', () => {
  const ordered = orderConversations([
    conversation('read-new', 0, '2026-11-04T12:00:00.000Z'),
    conversation('unread-old', 2, '2026-11-04T09:00:00.000Z'),
    conversation('unread-new', 1, '2026-11-04T11:00:00.000Z'),
    conversation('read-old', 0, '2026-11-04T08:00:00.000Z'),
  ]);

  assert.deepEqual(
    ordered.map(({ id }) => id),
    ['unread-new', 'unread-old', 'read-new', 'read-old'],
  );
});

test('message tone only plays for an increased unread count on a visible page', () => {
  assert.equal(
    shouldPlayMessageTone({ previousCount: null, unreadCount: 1, isPageVisible: true }),
    false,
  );
  assert.equal(
    shouldPlayMessageTone({ previousCount: 2, unreadCount: 2, isPageVisible: true }),
    false,
  );
  assert.equal(
    shouldPlayMessageTone({ previousCount: 2, unreadCount: 3, isPageVisible: false }),
    false,
  );
  assert.equal(
    shouldPlayMessageTone({ previousCount: 2, unreadCount: 3, isPageVisible: true }),
    true,
  );
});
