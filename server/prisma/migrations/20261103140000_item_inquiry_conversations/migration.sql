CREATE TYPE "ConversationKind" AS ENUM ('BOOKING', 'ITEM_INQUIRY');

ALTER TABLE "Conversation"
  ADD COLUMN "kind" "ConversationKind" NOT NULL DEFAULT 'BOOKING',
  ADD COLUMN "itemId" UUID,
  ADD COLUMN "participantId" UUID;

UPDATE "Conversation"
SET "itemId" = "Booking"."itemId"
FROM "Booking"
WHERE "Conversation"."bookingId" = "Booking"."id";

ALTER TABLE "Conversation" ALTER COLUMN "itemId" SET NOT NULL;
ALTER TABLE "Conversation" ALTER COLUMN "bookingId" DROP NOT NULL;

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Conversation_itemId_participantId_key"
  ON "Conversation"("itemId", "participantId");
