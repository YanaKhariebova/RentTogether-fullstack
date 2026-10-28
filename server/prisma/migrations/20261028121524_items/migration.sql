-- CreateTable
CREATE TABLE "Item" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "pricePerDay" DECIMAL(8,2) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemImage" (
    "id" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ItemImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Item_ownerId_createdAt_id_idx" ON "Item"("ownerId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Item_isPublished_createdAt_id_idx" ON "Item"("isPublished", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Item_categoryId_idx" ON "Item"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemImage_itemId_order_key" ON "ItemImage"("itemId", "order");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemImage" ADD CONSTRAINT "ItemImage_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Business constraints not represented by Prisma schema attributes.
ALTER TABLE "Item" ADD CONSTRAINT "Item_pricePerDay_positive" CHECK ("pricePerDay" > 0);
ALTER TABLE "ItemImage" ADD CONSTRAINT "ItemImage_order_nonnegative" CHECK ("order" >= 0);
