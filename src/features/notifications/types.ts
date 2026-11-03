export type BookingNotificationType =
  | 'BOOKING_REQUEST_CREATED'
  | 'BOOKING_APPROVED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_ACTIVE'
  | 'BOOKING_COMPLETED';

export type BookingNotification = {
  id: string;
  bookingId: string;
  itemTitle: string;
  type: BookingNotificationType;
  createdAt: string;
  readAt: string | null;
};

// Frontend representation; the API adapter flattens booking.id and booking.item.title.
export type NotificationsPage = {
  notifications: BookingNotification[];
  nextCursor: string | null;
};

export const notificationText: Record<BookingNotificationType, { title: string; body: string }> = {
  BOOKING_REQUEST_CREATED: {
    title: 'Neue Mietanfrage',
    body: 'Jemand möchte deine Sache leihen. Prüfe die Anfrage und die gewünschten Termine.',
  },
  BOOKING_APPROVED: {
    title: 'Deine Anfrage wurde bestätigt',
    body: 'Die vermietende Person hat deine Anfrage angenommen.',
  },
  BOOKING_REJECTED: {
    title: 'Deine Anfrage wurde abgelehnt',
    body: 'Die vermietende Person kann deine Anfrage leider nicht annehmen.',
  },
  BOOKING_CANCELLED: {
    title: 'Eine Anfrage wurde storniert',
    body: 'Die mietende Person hat ihre ausstehende Anfrage zurückgezogen.',
  },
  BOOKING_ACTIVE: {
    title: 'Deine Miete hat begonnen',
    body: 'Die Übergabe wurde bestätigt und deine Miete ist jetzt aktiv.',
  },
  BOOKING_COMPLETED: {
    title: 'Deine Miete ist abgeschlossen',
    body: 'Die vermietende Person hat die Rückgabe bestätigt.',
  },
};

export function notificationDestination(type: BookingNotificationType) {
  return type === 'BOOKING_REQUEST_CREATED' || type === 'BOOKING_CANCELLED'
    ? ('/account/bookings/incoming' as const)
    : ('/account/bookings/my-rentals' as const);
}
