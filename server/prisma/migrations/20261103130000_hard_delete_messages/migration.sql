ALTER TABLE "Message" DROP CONSTRAINT "Message_replyToMessageId_fkey";

ALTER TABLE "Message" DROP COLUMN "deletedAt";

ALTER TABLE "Message" ADD CONSTRAINT "Message_replyToMessageId_fkey"
  FOREIGN KEY ("replyToMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
