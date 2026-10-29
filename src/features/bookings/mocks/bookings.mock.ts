import type { Booking } from '../types/booking';

export const mockBookings: Booking[] = [
  {
    id: 'booking-1',
    itemId: 'item-1',
    itemTitle: 'Beamer für einen Filmabend',
    renterName: 'Mia',
    pickupDate: '2026-11-02',
    returnDate: '2026-11-04',
    pricePerDay: '15.50',
    totalPrice: '31.00',
    status: 'PENDING',
  },
  {
    id: 'booking-2',
    itemId: 'item-3',
    itemTitle: 'Campingzelt für 4 Personen',
    renterName: 'Du',
    pickupDate: '2026-11-08',
    returnDate: '2026-11-11',
    pricePerDay: '20.00',
    totalPrice: '60.00',
    status: 'APPROVED',
  },
  {
    id: 'booking-3',
    itemId: 'item-2',
    itemTitle: 'Akku-Bohrschrauber',
    renterName: 'Jonas',
    pickupDate: '2026-10-20',
    returnDate: '2026-10-22',
    pricePerDay: '12.00',
    totalPrice: '24.00',
    status: 'COMPLETED',
  },
];
