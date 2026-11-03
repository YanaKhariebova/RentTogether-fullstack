CREATE TABLE "HiddenConversation" (
  "conversationId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "hiddenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "HiddenConversation_pkey" PRIMARY KEY ("conversationId", "userId")
);

CREATE INDEX "HiddenConversation_userId_hiddenAt_idx"
  ON "HiddenConversation"("userId", "hiddenAt");

ALTER TABLE "HiddenConversation" ADD CONSTRAINT "HiddenConversation_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HiddenConversation" ADD CONSTRAINT "HiddenConversation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
