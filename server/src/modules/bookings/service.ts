import type { PrismaClient } from '../../generated/prisma/client.js';
import { ApiError } from '../../lib/errors.js';
import type { CreateBookingData } from './schemas.js';

export type BookingsDatabase = Pick<PrismaClient, 'item' | 'booking' | '$transaction'>;

function utcDay(value: string) {
  return Date.parse(`${value}T00:00:00.000Z`);
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function createBookingsService(prisma: BookingsDatabase) {
  return {
    async cancel(renterId: string, id: string) {
      const booking = await prisma.booking.findUnique({
        where: { id },
        select: { renterId: true, status: true },
      });
      if (!booking) throw new ApiError(404, 'BOOKING_NOT_FOUND', 'Die Anfrage wurde nicht gefunden.');
      if (booking.renterId !== renterId)
        throw new ApiError(403, 'FORBIDDEN', 'Du darfst diese Anfrage nicht stornieren.');
      if (booking.status !== 'PENDING')
        throw new ApiError(409, 'BOOKING_STATUS_INVALID', 'Diese Anfrage kann nicht mehr storniert werden.');
      return prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' }, select: { id: true, status: true } });
    },

    async updateOwnerStatus(
      ownerId: string,
      id: string,
      status: 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED',
    ) {
      return prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
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
        return tx.booking.update({
          where: { id },
          data: { status },
          select: { id: true, status: true },
        });
      });
    },
    async listIncoming(ownerId: string) {
      const bookings = await prisma.booking.findMany({
        where: { item: { ownerId } },
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
        where: { renterId },
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
      const item = await prisma.item.findUnique({
        where: { id: data.itemId },
        select: { id: true, ownerId: true, isPublished: true, pricePerDay: true },
      });
      if (!item || !item.isPublished)
        throw new ApiError(404, 'ITEM_NOT_FOUND', 'Die Anzeige wurde nicht gefunden.');
      if (item.ownerId === renterId)
        throw new ApiError(403, 'BOOKING_OWN_ITEM', 'Du kannst deine eigene Anzeige nicht mieten.');

      const totalDays = (utcDay(data.returnDate) - utcDay(data.pickupDate)) / 86_400_000;
      const totalPrice = item.pricePerDay.mul(totalDays);
      const booking = await prisma.booking.create({
        data: {
          itemId: item.id,
          renterId,
          pickupDate: toDate(data.pickupDate),
          returnDate: toDate(data.returnDate),
          status: 'PENDING',
          pricePerDaySnapshot: item.pricePerDay,
          totalPrice,
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
