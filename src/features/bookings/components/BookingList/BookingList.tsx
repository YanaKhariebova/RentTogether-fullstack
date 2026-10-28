import { useMemo, useState } from 'react';
import { Badge, Button } from '@/shared/ui/atoms';
import { mockBookings } from '../../mocks/bookings.mock';
import type { Booking, BookingStatus } from '../../types/booking';
import styles from './BookingList.module.css';

type BookingListProps = {
  view: 'rentals' | 'incoming';
};

const statusLabels: Record<BookingStatus, string> = {
  PENDING: 'Ausstehend',
  APPROVED: 'Bestätigt',
  REJECTED: 'Abgelehnt',
  CANCELLED: 'Storniert',
  ACTIVE: 'Aktiv',
  COMPLETED: 'Abgeschlossen',
};

function getBadgeVariant(status: BookingStatus) {
  if (status === 'APPROVED' || status === 'ACTIVE' || status === 'COMPLETED') {
    return 'success' as const;
  }

  if (status === 'PENDING') {
    return 'warning' as const;
  }

  return 'neutral' as const;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function formatPrice(value: string) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value));
}

export function BookingList({ view }: BookingListProps) {
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);

  const visibleBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        view === 'rentals' ? booking.renterName === 'Du' : booking.renterName !== 'Du',
      ),
    [bookings, view],
  );

  function updateStatus(bookingId: string, status: BookingStatus) {
    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.id === bookingId ? { ...booking, status } : booking,
      ),
    );
  }

  const isRentals = view === 'rentals';

  return (
    <section className={styles.section} aria-labelledby={`${view}-title`}>
      <div className={styles.heading}>
        <p className={styles.eyebrow}>{isRentals ? 'Als Mieterin' : 'Als Eigentümerin'}</p>
        <h1 id={`${view}-title`}>{isRentals ? 'Meine Mieten' : 'Eingehende Anfragen'}</h1>
      </div>

      {visibleBookings.length === 0 ? (
        <p className={styles.empty}>Noch keine Buchungen vorhanden.</p>
      ) : (
        <ul className={styles.list}>
          {visibleBookings.map((booking) => (
            <li key={booking.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2>{booking.itemTitle}</h2>
                  <p>
                    {isRentals
                      ? 'Vermietet über RentTogether'
                      : `Anfrage von ${booking.renterName}`}
                  </p>
                </div>
                <Badge variant={getBadgeVariant(booking.status)}>
                  {statusLabels[booking.status]}
                </Badge>
              </div>

              <dl className={styles.details}>
                <div>
                  <dt>Zeitraum</dt>
                  <dd>
                    {formatDate(booking.pickupDate)} – {formatDate(booking.returnDate)}
                  </dd>
                </div>
                <div>
                  <dt>Preis pro Tag</dt>
                  <dd>{formatPrice(booking.pricePerDay)}</dd>
                </div>
                <div>
                  <dt>Gesamtpreis</dt>
                  <dd>{formatPrice(booking.totalPrice)}</dd>
                </div>
              </dl>

              {isRentals && booking.status === 'PENDING' && (
                <Button variant="secondary" onClick={() => updateStatus(booking.id, 'CANCELLED')}>
                  Anfrage stornieren
                </Button>
              )}

              {!isRentals && booking.status === 'PENDING' && (
                <div className={styles.actions}>
                  <Button variant="primary" onClick={() => updateStatus(booking.id, 'APPROVED')}>
                    Annehmen
                  </Button>
                  <Button variant="secondary" onClick={() => updateStatus(booking.id, 'REJECTED')}>
                    Ablehnen
                  </Button>
                </div>
              )}

              {!isRentals && booking.status === 'APPROVED' && (
                <Button variant="primary" onClick={() => updateStatus(booking.id, 'ACTIVE')}>
                  Übergabe starten
                </Button>
              )}

              {!isRentals && booking.status === 'ACTIVE' && (
                <Button variant="primary" onClick={() => updateStatus(booking.id, 'COMPLETED')}>
                  Abschließen
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
