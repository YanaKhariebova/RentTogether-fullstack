ALTER TABLE "Message"
  ADD COLUMN "replyToMessageId" UUID,
  ADD COLUMN "editedAt" TIMESTAMP(3),
  ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Message_replyToMessageId_idx" ON "Message"("replyToMessageId");

ALTER TABLE "Message" ADD CONSTRAINT "Message_replyToMessageId_fkey"
  FOREIGN KEY ("replyToMessageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
