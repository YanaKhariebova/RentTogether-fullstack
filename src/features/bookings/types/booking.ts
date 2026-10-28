export type BookingStatus =
  'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'ACTIVE' | 'COMPLETED';

export type Booking = {
  id: string;
  itemId: string;
  itemTitle: string;
  renterName: string;
  pickupDate: string;
  returnDate: string;
  pricePerDay: string;
  totalPrice: string;
  status: BookingStatus;
};
