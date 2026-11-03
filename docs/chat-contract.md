# Chat: agreed contract

## Scope of the first version

- One conversation belongs to exactly one `Booking`.
- Only the booking renter and the item owner can read or write in that conversation.
- Messages are plain text only. Files, reactions, deletion and online presence are out of scope.
- The application shows unread-message badges inside the site. It does not send push notifications.

## Booking status rules

Writing is allowed while a booking is `PENDING`, `APPROVED` or `ACTIVE`.

For `REJECTED`, `CANCELLED` and `COMPLETED`, both participants can read the existing history, but
cannot send new messages.

## Prisma model draft

```text
Conversation
- id: UUID
- bookingId: UUID, unique
- createdAt
- updatedAt

Message
- id: UUID
- conversationId: UUID
- senderId: UUID
- body: String (after trim: 1–2000 characters)
- createdAt
- readAt: DateTime | null
```

`senderId` always comes from the authenticated server user. Because a conversation has exactly two
participants, `readAt` is sufficient: every message has one recipient.

## Planned API

- `POST /api/bookings/:bookingId/conversation` — create or return the existing conversation.
- `GET /api/conversations` — the current user's conversations, last message and `unreadCount`.
- `GET /api/conversations/:id/messages` — paginated messages in a stable order.
- `POST /api/conversations/:id/messages` — send `{ "body": "..." }`.
- `PATCH /api/conversations/:id/read` — mark incoming messages up to `lastReadMessageId` as read.
- `GET /api/conversations/unread-count` — count for the navigation badge.

Every route verifies that the current user participates in the associated booking. Conversation
creation must be idempotent, including concurrent requests. Sending a message must atomically check
the current booking status.

## Frontend integration

- `/account/messages` — conversation list.
- `/account/messages/:conversationId` — conversation view.
- Desktop Header: `Nachrichten` with unread badge.
- Mobile: `Nachrichten` lives in the hamburger menu. The closed menu button has a small indicator
  when unread count is greater than zero. The badge is hidden for zero and displays `99+` over 99.

As of 2026-11-03, Yana takes over Header, hamburger menu and mobile navigation from Vlad,
including Nachrichten and its unread badge. Olga owns deployment, Cloudinary and common
integration. PWA ownership still needs explicit coordination. See [team status](team-status.md).

The shared demo deployment and the two-user Booking scenario have been completed according to
Olga. Chat and Booking notifications are additional work, not an unfulfilled original MVP item.
This document is a contract: it does not claim the Conversation/Message backend or migration is
already implemented. Preserve separate read state for messages and general notifications.
