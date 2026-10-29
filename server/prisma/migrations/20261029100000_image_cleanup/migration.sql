CREATE TABLE "ImageCleanup" (
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImageCleanup_pkey" PRIMARY KEY ("storageKey")
);
