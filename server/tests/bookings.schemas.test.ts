import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createBookingSchema } from '../src/modules/bookings/schemas.js';

function dateFromToday(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

const valid = {
  itemId: '10000000-0000-4000-8000-000000000001',
  pickupDate: dateFromToday(7),
  returnDate: dateFromToday(10),
};

test('booking creation accepts an item and an ordered date range', () => {
  assert.deepEqual(createBookingSchema.parse(valid), valid);
});

test('booking creation rejects invalid IDs, dates, equal dates and extra fields', () => {
  for (const body of [
    { ...valid, itemId: 'mock-item' },
    { ...valid, pickupDate: '01.11.2026' },
    { ...valid, pickupDate: '2026-02-30' },
    { ...valid, pickupDate: dateFromToday(-1) },
    { ...valid, returnDate: valid.pickupDate },
    { ...valid, returnDate: dateFromToday(6) },
    { ...valid, renterId: '10000000-0000-4000-8000-000000000002' },
  ]) {
    assert.equal(createBookingSchema.safeParse(body).success, false);
  }
});
