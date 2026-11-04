import { Prisma } from '../../generated/prisma/client.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { ApiError } from '../../lib/errors.js';
import type { CreateBookingData } from './schemas.js';

export type BookingsDatabase = Pick<
  PrismaClient,
  'item' | 'booking' | 'notification' | '$transaction'
>;

function utcDay(value: string) {
  return Date.parse(`${value}T00:00:00.000Z`);
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function createBookingsService(prisma: BookingsDatabase) {
  return {
    async listUnavailableDates(itemId: string) {
      const bookings = await prisma.booking.findMany({
        where: { itemId, status: { in: ['APPROVED', 'ACTIVE'] } },
        select: { pickupDate: true, returnDate: true },
      });
      return bookings.map((booking) => ({
        pickupDate: booking.pickupDate.toISOString().slice(0, 10),
        returnDate: booking.returnDate.toISOString().slice(0, 10),
      }));
    },
    async cancel(renterId: string, id: string) {
      return prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { id },
          select: { itemId: true, renterId: true, status: true },
        });
        if (!booking)
          throw new ApiError(404, 'BOOKING_NOT_FOUND', 'Die Anfrage wurde nicht gefunden.');
        await tx.$queryRaw(
          Prisma.sql`SELECT "id" FROM "Item" WHERE "id" = ${booking.itemId}::uuid FOR UPDATE`,
        );
        const lockedBooking = await tx.booking.findUnique({
          where: { id },
          include: { item: { select: { ownerId: true } } },
        });
        if (!lockedBooking)
          throw new ApiError(404, 'BOOKING_NOT_FOUND', 'Die Anfrage wurde nicht gefunden.');
        if (lockedBooking.renterId !== renterId)
          throw new ApiError(403, 'FORBIDDEN', 'Du darfst diese Anfrage nicht stornieren.');
        if (lockedBooking.status !== 'PENDING')
          throw new ApiError(
            409,
            'BOOKING_STATUS_INVALID',
            'Diese Anfrage kann nicht mehr storniert werden.',
          );
        const updated = await tx.booking.update({
          where: { id },
          data: { status: 'CANCELLED' },
          select: { id: true, status: true },
        });
        await tx.notification.upsert({
          where: {
            bookingId_userId_type: {
              bookingId: id,
              userId: lockedBooking.item.ownerId,
              type: 'BOOKING_CANCELLED',
            },
          },
          create: { bookingId: id, userId: lockedBooking.item.ownerId, type: 'BOOKING_CANCELLED' },
          update: {},
        });
        return updated;
      });
    },

    async updateOwnerStatus(
      ownerId: string,
      id: string,
      status: 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED',
    ) {
      return prisma.$transaction(async (tx) => {
        let booking = await tx.booking.findUnique({
          where: { id },
          include: { item: { select: { ownerId: true } } },
        });
        if (!booking)
          throw new ApiError(404, 'BOOKING_NOT_FOUND', 'Die Anfrage wurde nicht gefunden.');
        await tx.$queryRaw(
          Prisma.sql`SELECT "id" FROM "Item" WHERE "id" = ${booking.itemId}::uuid FOR UPDATE`,
        );
        booking = await tx.booking.findUnique({
          where: { id },
          include: { item: { select: { ownerId: true } } },
        });
        if (!booking)
          throw new ApiError(404, 'BOOKING_NOT_FOUND', 'Die Anfrage wurde nicht gefunden.');
        if (booking.item.ownerId !== ownerId)
          throw new ApiError(403, 'FORBIDDEN', 'Du darfst diese Anfrage nicht ändern.');
        const allowed =
          (booking.status === 'PENDING' && ['APPROVED', 'REJECTED'].includes(status)) ||
          (booking.status === 'APPROVED' && status === 'ACTIVE') ||
          (booking.status === 'ACTIVE' && status === 'COMPLETED');
        if (!allowed)
          throw new ApiError(
            409,
            'BOOKING_STATUS_INVALID',
            'Diese Anfrage kann nicht mehr geändert werden.',
          );
        if (status === 'APPROVED') {
          const conflict = await tx.booking.findFirst({
            where: {
              itemId: booking.itemId,
              status: { in: ['APPROVED', 'ACTIVE'] },
              pickupDate: { lt: booking.returnDate },
              returnDate: { gt: booking.pickupDate },
            },
          });
          if (conflict)
            throw new ApiError(
              409,
              'BOOKING_DATES_UNAVAILABLE',
              'Dieser Zeitraum ist nicht mehr verfügbar.',
            );
        }
        const updated = await tx.booking.update({
          where: { id },
          data: { status },
          select: { id: true, status: true },
        });
        const typeByStatus = {
          APPROVED: 'BOOKING_APPROVED',
          REJECTED: 'BOOKING_REJECTED',
          ACTIVE: 'BOOKING_ACTIVE',
          COMPLETED: 'BOOKING_COMPLETED',
        } as const;
        await tx.notification.upsert({
          where: {
            bookingId_userId_type: {
              bookingId: id,
              userId: booking.renterId,
              type: typeByStatus[status],
            },
          },
          create: { bookingId: id, userId: booking.renterId, type: typeByStatus[status] },
          update: {},
        });
        return updated;
      });
    },
    async archiveHistory(userId: string, id: string) {
      const booking = await prisma.booking.findFirst({
        where: { id, OR: [{ renterId: userId }, { item: { ownerId: userId } }] },
        select: { renterId: true, status: true },
      });
      if (!booking)
        throw new ApiError(404, 'BOOKING_NOT_FOUND', 'Die Anfrage wurde nicht gefunden.');
      if (!['COMPLETED', 'CANCELLED', 'REJECTED'].includes(booking.status))
        throw new ApiError(
          409,
          'BOOKING_STATUS_INVALID',
          'Nur abgeschlossene, stornierte oder abgelehnte Anfragen können aus dem Verlauf entfernt werden.',
        );
      const isRenter = booking.renterId === userId;
      await prisma.booking.updateMany({
        where: {
          id,
          status: { in: ['COMPLETED', 'CANCELLED', 'REJECTED'] },
          ...(isRenter
            ? { renterId: userId, renterArchivedAt: null }
            : { item: { ownerId: userId }, ownerArchivedAt: null }),
        },
        data: isRenter ? { renterArchivedAt: new Date() } : { ownerArchivedAt: new Date() },
      });
    },
    async listIncoming(ownerId: string) {
      const bookings = await prisma.booking.findMany({
        where: { item: { ownerId }, ownerArchivedAt: null },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          itemId: true,
          pickupDate: true,
          returnDate: true,
          status: true,
          pricePerDaySnapshot: true,
          totalPrice: true,
          item: { select: { title: true } },
          renter: { select: { name: true } },
        },
      });
      return bookings.map((booking) => ({
        id: booking.id,
        itemId: booking.itemId,
        itemTitle: booking.item.title,
        renterName: booking.renter.name,
        pickupDate: booking.pickupDate.toISOString().slice(0, 10),
        returnDate: booking.returnDate.toISOString().slice(0, 10),
        status: booking.status,
        pricePerDay: booking.pricePerDaySnapshot.toFixed(2),
        totalPrice: booking.totalPrice.toFixed(2),
      }));
    },

    async listRentals(renterId: string) {
      const bookings = await prisma.booking.findMany({
        where: { renterId, renterArchivedAt: null },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          itemId: true,
          pickupDate: true,
          returnDate: true,
          status: true,
          pricePerDaySnapshot: true,
          totalPrice: true,
          item: { select: { title: true } },
        },
      });
      return bookings.map((booking) => ({
        id: booking.id,
        itemId: booking.itemId,
        itemTitle: booking.item.title,
        renterName: 'Du',
        pickupDate: booking.pickupDate.toISOString().slice(0, 10),
        returnDate: booking.returnDate.toISOString().slice(0, 10),
        status: booking.status,
        pricePerDay: booking.pricePerDaySnapshot.toFixed(2),
        totalPrice: booking.totalPrice.toFixed(2),
      }));
    },

    async create(renterId: string, data: CreateBookingData) {
      const booking = await prisma.$transaction(async (tx) => {
        const item = await tx.item.findUnique({
          where: { id: data.itemId },
          select: { id: true, ownerId: true, isPublished: true, pricePerDay: true },
        });
        if (!item || !item.isPublished)
          throw new ApiError(404, 'ITEM_NOT_FOUND', 'Die Anzeige wurde nicht gefunden.');
        if (item.ownerId === renterId)
          throw new ApiError(
            403,
            'BOOKING_OWN_ITEM',
            'Du kannst deine eigene Anzeige nicht mieten.',
          );
        const totalDays = (utcDay(data.returnDate) - utcDay(data.pickupDate)) / 86_400_000;
        const created = await tx.booking.create({
          data: {
            itemId: item.id,
            renterId,
            pickupDate: toDate(data.pickupDate),
            returnDate: toDate(data.returnDate),
            status: 'PENDING',
            pricePerDaySnapshot: item.pricePerDay,
            totalPrice: item.pricePerDay.mul(totalDays),
          },
          select: {
            id: true,
            itemId: true,
            pickupDate: true,
            returnDate: true,
            status: true,
            pricePerDaySnapshot: true,
            totalPrice: true,
          },
        });
        await tx.notification.create({
          data: { bookingId: created.id, userId: item.ownerId, type: 'BOOKING_REQUEST_CREATED' },
        });
        return created;
      });
      return {
        ...booking,
        pickupDate: booking.pickupDate.toISOString().slice(0, 10),
        returnDate: booking.returnDate.toISOString().slice(0, 10),
        pricePerDaySnapshot: booking.pricePerDaySnapshot.toFixed(2),
        totalPrice: booking.totalPrice.toFixed(2),
      };
    },
  };
}
