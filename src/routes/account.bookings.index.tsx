import { createFileRoute } from '@tanstack/react-router';
import { BookingNotifications } from '@/features/notifications/BookingNotifications';
export const Route = createFileRoute('/account/bookings/')({ component: BookingNotifications });
