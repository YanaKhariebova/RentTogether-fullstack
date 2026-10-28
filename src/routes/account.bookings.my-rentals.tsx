import { createFileRoute } from '@tanstack/react-router';
import { BookingList } from '../features/bookings/components/BookingList/BookingList';

export const Route = createFileRoute('/account/bookings/my-rentals')({
  component: () => <BookingList view="rentals" />,
});
