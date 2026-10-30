import { z } from 'zod';

function isCalendarDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function todayInUtc() {
  return new Date().toISOString().slice(0, 10);
}

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Bitte verwende ein gültiges Datum.')
  .refine(isCalendarDate, 'Bitte verwende ein gültiges Datum.');

export const createBookingSchema = z
  .strictObject({
    itemId: z.uuid('Ungültige Anzeigen-ID.'),
    pickupDate: isoDate,
    returnDate: isoDate,
  })
  .refine((data) => data.returnDate > data.pickupDate, {
    path: ['returnDate'],
    message: 'Das Rückgabedatum muss nach dem Abholdatum liegen.',
  })
  .refine((data) => data.pickupDate >= todayInUtc(), {
    path: ['pickupDate'],
    message: 'Das Abholdatum darf nicht in der Vergangenheit liegen.',
  });

export type CreateBookingData = z.infer<typeof createBookingSchema>;

export const bookingParamsSchema = z.object({ id: z.uuid('Ungültige Buchungs-ID.') });
export const ownerBookingStatusSchema = z.strictObject({
  status: z.enum(['APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED']),
});
