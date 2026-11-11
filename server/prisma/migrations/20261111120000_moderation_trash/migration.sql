ALTER TABLE "Item" ADD COLUMN "moderationRemovedAt" TIMESTAMP(3);

CREATE INDEX "Item_moderationRemovedAt_idx" ON "Item"("moderationRemovedAt");
