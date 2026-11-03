-- Personal history visibility; booking records and conversations are preserved.
ALTER TABLE "Booking" ADD COLUMN "renterArchivedAt" TIMESTAMP(3),
ADD COLUMN "ownerArchivedAt" TIMESTAMP(3);
