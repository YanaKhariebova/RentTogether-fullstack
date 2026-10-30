CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'ACTIVE', 'COMPLETED');

CREATE TABLE "Booking" (
    "id" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "renterId" UUID NOT NULL,
    "pickupDate" DATE NOT NULL,
    "returnDate" DATE NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "pricePerDaySnapshot" DECIMAL(8,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Booking_dates_valid" CHECK ("returnDate" > "pickupDate"),
    CONSTRAINT "Booking_price_valid" CHECK ("pricePerDaySnapshot" > 0 AND "totalPrice" > 0)
);

CREATE INDEX "Booking_renterId_createdAt_id_idx" ON "Booking"("renterId", "createdAt", "id");
CREATE INDEX "Booking_itemId_status_pickupDate_returnDate_idx" ON "Booking"("itemId", "status", "pickupDate", "returnDate");

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_renterId_fkey"
  FOREIGN KEY ("renterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
