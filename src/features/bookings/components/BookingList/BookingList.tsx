import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Badge, Button, IconButton, Spinner } from '@/shared/ui/atoms';
import { useNavigate } from '@tanstack/react-router';
import { useMyRentalsQuery } from '../../api/useMyRentalsQuery';
import { useIncomingBookingsQuery } from '../../api/useIncomingBookingsQuery';
import { useOwnerBookingStatusMutation } from '../../api/useOwnerBookingStatusMutation';
import { useCancelBookingMutation } from '../../api/useCancelBookingMutation';
import { useCreateConversationMutation } from '@/features/messages/api/useConversations';
import { useArchiveBookingMutation } from '../../api/useArchiveBookingMutation';
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
  const isRentals = view === 'rentals';
  const rentalsQuery = useMyRentalsQuery(isRentals);
  const incomingQuery = useIncomingBookingsQuery(!isRentals);
  const ownerStatus = useOwnerBookingStatusMutation();
  const cancelBooking = useCancelBookingMutation();
  const createConversation = useCreateConversationMutation();
  const navigate = useNavigate();
  const archive = useArchiveBookingMutation();
  const [selected, setSelected] = useState<Booking | null>(null);
  const [notice, setNotice] = useState('');
  const confirmation = useRef<HTMLDialogElement>(null);
  const dialogId = useId();
  useEffect(() => {
    if (selected && !confirmation.current?.open) confirmation.current?.showModal();
    if (!selected && confirmation.current?.open) confirmation.current.close();
  }, [selected]);
  const sourceBookings = useMemo(
    () => (isRentals ? (rentalsQuery.data?.bookings ?? []) : (incomingQuery.data?.bookings ?? [])),
    [isRentals, rentalsQuery.data, incomingQuery.data],
  );
  // The authenticated API already separates rentals from incoming requests.
  const actionError = isRentals
    ? (cancelBooking.error ?? createConversation.error)
    : (ownerStatus.error ?? createConversation.error);

  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!sourceBookings.some((booking) => id === `booking-${booking.id}`)) return;
    document.getElementById(id)?.scrollIntoView({ block: 'center' });
  }, [sourceBookings]);

  return (
    <section className={styles.section} aria-labelledby={`${view}-title`}>
      <div className={styles.heading}>
        <p className={styles.eyebrow}>{isRentals ? 'Als Mieterin' : 'Als Eigentümerin'}</p>
        <h1 id={`${view}-title`}>{isRentals ? 'Meine Mieten' : 'Eingehende Anfragen'}</h1>
      </div>

      {actionError && <p role="alert">{actionError.message}</p>}
      {notice && <p role="status">{notice}</p>}
      <dialog
        ref={confirmation}
        className={styles.dialog}
        aria-labelledby={dialogId + '-title'}
        aria-describedby={dialogId + '-description'}
        onCancel={(event) => {
          event.preventDefault();
          if (!archive.isPending) setSelected(null);
        }}
      >
        <h2 id={dialogId + '-title'}>Anfrage aus deinem Verlauf entfernen?</h2>
        <p id={dialogId + '-description'}>
          „{selected?.itemTitle}“ wird nur aus deinem Verlauf und deinen zugehörigen
          Benachrichtigungen entfernt. Für die andere Person und im Chat bleibt die Buchung
          erhalten.
        </p>
        {archive.error && <p role="alert">{archive.error.message}</p>}
        <div className={styles.actions}>
          <Button autoFocus disabled={archive.isPending} onClick={() => setSelected(null)}>
            Abbrechen
          </Button>
          <Button
            variant="danger"
            loading={archive.isPending}
            onClick={() => {
              if (!selected) return;
              archive.mutate(selected.id, {
                onSuccess: () => {
                  setSelected(null);
                  setNotice('Die Anfrage wurde aus deinem Verlauf entfernt.');
                },
              });
            }}
          >
            Aus meinem Verlauf entfernen
          </Button>
        </div>
      </dialog>

      {(isRentals ? rentalsQuery.isPending : incomingQuery.isPending) ? (
        <div className={styles.empty}>
          <Spinner label="Buchungen werden geladen …" />
        </div>
      ) : (isRentals ? rentalsQuery.isError : incomingQuery.isError) ? (
        <div className={styles.empty}>
          <p role="alert">Buchungen konnten nicht geladen werden.</p>
          <Button
            onClick={() => void (isRentals ? rentalsQuery.refetch() : incomingQuery.refetch())}
          >
            Erneut versuchen
          </Button>
        </div>
      ) : sourceBookings.length === 0 ? (
        <p className={styles.empty}>Noch keine Buchungen vorhanden.</p>
      ) : (
        <ul className={styles.list}>
          {sourceBookings.map((booking) => (
            <li key={booking.id} id={`booking-${booking.id}`} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2>{booking.itemTitle}</h2>
                  <p>
                    {isRentals
                      ? 'Vermietet über RentTogether'
                      : `Anfrage von ${booking.renterName}`}
                  </p>
                </div>
                <div className={styles.statusActions}>
                  <Badge variant={getBadgeVariant(booking.status)}>
                    {statusLabels[booking.status]}
                  </Badge>
                  {['COMPLETED', 'CANCELLED', 'REJECTED'].includes(booking.status) && (
                    <IconButton
                      label={booking.itemTitle + ': aus meinem Verlauf entfernen'}
                      className={styles.archiveButton}
                      disabled={archive.isPending}
                      onClick={() => {
                        archive.reset();
                        setNotice('');
                        setSelected(booking);
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" />
                      </svg>
                    </IconButton>
                  )}
                </div>
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

              <Button
                variant="secondary"
                disabled={createConversation.isPending}
                onClick={() =>
                  void createConversation.mutateAsync(booking.id).then(({ conversation }) =>
                    navigate({
                      to: '/account/messages/$conversationId',
                      params: { conversationId: conversation.id },
                    }),
                  )
                }
              >
                Nachrichten
              </Button>

              {isRentals && booking.status === 'PENDING' && (
                <Button
                  variant="secondary"
                  disabled={cancelBooking.isPending}
                  onClick={() => cancelBooking.mutate({ id: booking.id, itemId: booking.itemId })}
                >
                  Anfrage stornieren
                </Button>
              )}

              {!isRentals && booking.status === 'PENDING' && (
                <div className={styles.actions}>
                  <Button
                    variant="primary"
                    disabled={ownerStatus.isPending}
                    onClick={() =>
                      ownerStatus.mutate({
                        id: booking.id,
                        itemId: booking.itemId,
                        status: 'APPROVED',
                      })
                    }
                  >
                    Annehmen
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={ownerStatus.isPending}
                    onClick={() =>
                      ownerStatus.mutate({
                        id: booking.id,
                        itemId: booking.itemId,
                        status: 'REJECTED',
                      })
                    }
                  >
                    Ablehnen
                  </Button>
                </div>
              )}

              {!isRentals && booking.status === 'APPROVED' && (
                <Button
                  variant="primary"
                  disabled={ownerStatus.isPending}
                  onClick={() =>
                    ownerStatus.mutate({ id: booking.id, itemId: booking.itemId, status: 'ACTIVE' })
                  }
                >
                  Übergabe starten
                </Button>
              )}

              {!isRentals && booking.status === 'ACTIVE' && (
                <Button
                  variant="primary"
                  disabled={ownerStatus.isPending}
                  onClick={() =>
                    ownerStatus.mutate({
                      id: booking.id,
                      itemId: booking.itemId,
                      status: 'COMPLETED',
                    })
                  }
                >
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
