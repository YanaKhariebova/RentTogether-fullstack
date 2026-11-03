# Chat: agreed contract

## Scope of the first version

- One conversation belongs to exactly one `Booking`.
- Only the booking renter and the item owner can read or write in that conversation.
- Messages are plain text only. Files, reactions and online presence are out of scope.
- The application shows unread-message badges inside the site. It does not send push notifications.

## Booking status rules

Writing is allowed while a booking is `PENDING`, `APPROVED` or `ACTIVE`.

For `REJECTED`, `CANCELLED` and `COMPLETED`, both participants can read the existing history, but
cannot send, edit or delete messages.

## Proposal: questions about an item before booking

> Confirmed by Olga on 2026-11-03. The implementation uses this model and API.

An authenticated user may ask the owner a question about a published item before choosing dates.
The item owner never sees this action on their own item. A direct inquiry is separate from the
existing Booking conversation and does not change its rules.

### Conversation model proposal

```text
enum ConversationKind
- BOOKING
- ITEM_INQUIRY

Conversation
- id: UUID
- kind: ConversationKind
- itemId: UUID                     # required for both kinds
- bookingId: UUID | null, unique   # required by backend only for BOOKING
- participantId: UUID | null       # interested user; required only for ITEM_INQUIRY
- createdAt
- updatedAt

constraints
- @@unique([itemId, participantId])
```

For `ITEM_INQUIRY`, the owner is derived from `item.ownerId`; `participantId` is the other
participant. The unique pair makes repeated requests return one direct dialog. For `BOOKING`,
`bookingId` remains unique and `participantId` is `null`, so existing Booking dialogs are not
merged or deduplicated by item.

### Proposed API

- `POST /api/items/:itemId/conversation/messages` — validates that the item is still published,
  then atomically creates the first `ITEM_INQUIRY` conversation and its first message. Repeated
  requests reuse the existing direct dialog. It returns `{ conversation, message }`.
- Existing `GET /api/conversations`, `GET /api/conversations/:id/messages`,
  `POST /api/conversations/:id/messages`, edit, delete and read routes support both kinds.

The button opens a frontend compose screen for the item. It has no conversation ID and does not
write to the database until the user submits a non-empty first message to the endpoint above.

Only the owner and `participantId` may read a direct dialog. Direct inquiry messages are allowed
while the item is published. The backend derives the recipient from the item and never accepts an
owner or participant ID in a request body.

### Decisions still needed

1. When a Booking is created after a direct inquiry, the proposal keeps both dialogs separate;
   messages are not copied or moved.
2. When an item is hidden, the proposal makes a direct dialog read-only but keeps its history.
   When an item is permanently deleted, the direct dialog and messages are deleted by cascade.

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
- replyToMessageId: UUID | null
- editedAt: DateTime | null
```

`senderId` always comes from the authenticated server user. Because a conversation has exactly two
participants, `readAt` is sufficient: every message has one recipient.

## Planned API

- `POST /api/bookings/:bookingId/conversation` — create or return the existing conversation.
- `GET /api/conversations` — the current user's conversations, last message and `unreadCount`.
- `GET /api/conversations/:id/messages` — paginated messages in a stable order.
- `POST /api/conversations/:id/messages` — send `{ "body": "...", "replyToMessageId": "uuid?" }`.
- `PATCH /api/conversations/:id/messages/:messageId` — edit the author's message.
- `DELETE /api/conversations/:id/messages/:messageId` — permanently delete the author's message for
  both participants.
- `PATCH /api/conversations/:id/read` — mark incoming messages up to `lastReadMessageId` as read.
- `GET /api/conversations/unread-count` — count for the navigation badge.

Every route verifies that the current user participates in the associated booking. Conversation
creation must be idempotent, including concurrent requests. Sending a message must atomically check
the current booking status.

## Editing, replies and deletion

- Only the author may edit a message, and only during the first 15 minutes after sending.
- Editing sets `editedAt`; the UI displays `Bearbeitet`.
- A reply points only to a message in the same conversation. The UI shows its author and a short
  quote.
- The author may permanently delete their message for both participants at any time while the Booking
  is active. There is no placeholder text. Existing replies remain, but their `replyToMessageId` is
  cleared, so the quote disappears.
- When deletion removes the most recent message, the conversation preview uses the next most recent
  remaining message. With no remaining messages, it is an empty conversation.

## Frontend integration

- `/account/messages` — conversation list.
- `/account/messages/:conversationId` — conversation view.
- Desktop Header: `Nachrichten` with unread badge.
- Mobile: `Nachrichten` lives in the hamburger menu. The closed menu button has a small indicator
  when unread count is greater than zero. The badge is hidden for zero and displays `99+` over 99.

## Hiding a conversation for one participant

`HiddenConversation` is a personal list preference, not deletion of chat history:

```text
HiddenConversation
- conversationId: UUID
- userId: UUID
- hiddenAt: DateTime
- @@unique([conversationId, userId])
```

- `DELETE /api/conversations/:id` hides the dialog only for the current participant. The action is
  idempotent and is available for open chats and closed Booking chats.
- The API never deletes messages or changes the other participant's list.
- Existing unread messages in a hidden dialog do not contribute to the unread badge.
- A new incoming message removes that participant's `HiddenConversation` row atomically with the
  message creation. The dialog returns to the list and its new unread count is shown.
- The UI asks for confirmation before hiding a conversation.

As of 2026-11-03, Yana takes over Header, hamburger menu and mobile navigation from Vlad,
including Nachrichten and its unread badge. Olga owns deployment, Cloudinary and common
integration. PWA ownership still needs explicit coordination. See [team status](team-status.md).

The shared demo deployment and the two-user Booking scenario have been completed according to
Olga. Chat and Booking notifications are additional work, not an unfulfilled original MVP item.
This document is a contract: it does not claim the Conversation/Message backend or migration is
already implemented. Preserve separate read state for messages and general notifications.

Header, mobile navigation and the integration of `Nachrichten` are owned by Yana. Chat API
integration starts only after this contract has been reviewed and the database migration has been
approved.

## Booking notifications: agreed contract

Notifications are separate from chat messages. Opening a notification must not mark messages as
read, and reading a chat message must not change `Notification.readAt`.

### Prisma model draft

```text
enum NotificationType
- BOOKING_REQUEST_CREATED
- BOOKING_APPROVED
- BOOKING_REJECTED
- BOOKING_CANCELLED
- BOOKING_ACTIVE
- BOOKING_COMPLETED

Notification
- id: UUID
- userId: UUID                    # recipient; set only by the server
- bookingId: UUID
- type: NotificationType
- createdAt: DateTime
- readAt: DateTime | null

relations
- User.notifications: Notification[]
- Booking.notifications: Notification[]

constraints and indexes
- @@unique([bookingId, userId, type])
- @@index([userId, createdAt, id])
```

The unique constraint makes a repeated status request idempotent: the same booking event cannot
create a second notification for the same recipient. Deleting a user or booking cascades to its
notifications.

### Events and recipients

| Event                            | `type`                    | Recipient  |
| -------------------------------- | ------------------------- | ---------- |
| Renter creates a booking         | `BOOKING_REQUEST_CREATED` | item owner |
| Owner approves                   | `BOOKING_APPROVED`        | renter     |
| Owner rejects                    | `BOOKING_REJECTED`        | renter     |
| Renter cancels a pending booking | `BOOKING_CANCELLED`       | item owner |
| Owner starts handover            | `BOOKING_ACTIVE`          | renter     |
| Owner completes the booking      | `BOOKING_COMPLETED`       | renter     |

The booking service creates the notification in the same database transaction as the corresponding
Booking create or status transition. If the transaction is rolled back, no notification exists.
The recipient is never accepted from an HTTP request body.

### Planned API

- `GET /api/me/notifications?cursor=&limit=` — current user's notifications, with booking/item
  summary and pagination. Stable order: `createdAt DESC`, then `id DESC`.
- `GET /api/me/notifications/unread-count` — unread count for the current user.
- `PATCH /api/me/notifications/read` — mark selected notifications as read:

  ```json
  { "ids": ["notification-uuid-1", "notification-uuid-2"] }
  ```

  The endpoint updates only notifications belonging to the current user and only where `readAt` is
  still `null`. A repeated request succeeds and preserves the first `readAt` timestamp. Opening the
  notification's booking or using an explicit read action can call this endpoint; opening the menu
  must not mark every notification as read.

Conversation lists use `updatedAt DESC`, then `id DESC`. Message pages use a cursor and stable
`createdAt DESC`, then `id DESC` order; the client renders the received page chronologically. The
API accepts a bounded `limit` and returns a next cursor where more rows exist.

### Transaction, access and cache rules

- Every notification route scopes queries and updates to `res.locals.currentUser.id`.
- Every conversation route verifies that the current user is the booking renter or current item
  owner.
- Creating a conversation is idempotent, including concurrent requests; `bookingId` is unique.
- Sending a message locks and rereads the Booking in the same transaction before checking whether
  its status allows writing. This prevents a message from being sent concurrently with cancellation
  or completion.
- Query keys for conversations, unread-message count, notifications and unread-notification count
  include the authenticated user ID. Mutations invalidate only that user's affected data.
- The client refreshes counts after relevant actions and by periodic polling. There is no promise
  of real-time delivery, browser push, email or SMS in the first version.
- A badge is hidden for zero, and displays `99+` when the count is above 99.

## Delivery order

1. Olya approved this schema and API contract on 2026-11-03; update the feature branch from main before the migration.
2. Add Prisma relations and one migration for Conversation, Message and Notification.
3. Implement and test transactional Booking notifications before connecting Header badges.
4. Implement Chat API and then connect `/account/messages`, Header and mobile navigation.
