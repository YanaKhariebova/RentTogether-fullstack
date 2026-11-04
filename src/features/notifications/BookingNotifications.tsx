import { Link } from '@tanstack/react-router';
import { Button, Spinner } from '@/shared/ui/atoms';
import { ApiError } from '@/shared/api/client';
import {
  useBookingNotifications,
  useBookingNotificationCount,
  useReadBookingNotification,
} from './api/useBookingNotifications';
import { notificationDestination, notificationText } from './types';
import type { BookingNotification } from './types';
import styles from './BookingNotifications.module.css';

export function BookingNotifications() {
  const query = useBookingNotifications();
  const count = useBookingNotificationCount();
  const read = useReadBookingNotification();
  const notifications = [
    ...new Map(
      (query.data?.pages ?? [])
        .flatMap((page) => page.notifications)
        .map((item) => [item.id, item]),
    ).values(),
  ].sort((first, second) => {
    const unreadDifference = Number(Boolean(first.readAt)) - Number(Boolean(second.readAt));
    if (unreadDifference) return unreadDifference;

    const dateDifference = second.createdAt.localeCompare(first.createdAt);
    return dateDifference || second.id.localeCompare(first.id);
  });
  return (
    <BookingNotificationsView
      notifications={notifications}
      unreadCount={count.data?.unreadCount}
      loading={query.isPending}
      unavailable={query.error instanceof ApiError && query.error.status === 404}
      error={query.isError || count.isError}
      readError={read.isError}
      onRetry={() => {
        void query.refetch();
        void count.refetch();
      }}
      onRead={(ids) => read.mutate(ids)}
      readingId={read.isPending ? read.variables?.[0] : undefined}
      hasMore={!!query.hasNextPage}
      loadingMore={query.isFetchingNextPage}
      onLoadMore={() => void query.fetchNextPage()}
    />
  );
}

type Props = {
  notifications: BookingNotification[];
  unreadCount?: number;
  loading?: boolean;
  unavailable?: boolean;
  error?: boolean;
  readError?: boolean;
  readingId?: string;
  hasMore?: boolean;
  loadingMore?: boolean;
  onRetry: () => void;
  onRead: (ids: string[]) => void;
  onLoadMore: () => void;
};

export function BookingNotificationsView({
  notifications,
  unreadCount,
  loading,
  unavailable,
  error,
  readError,
  readingId,
  hasMore,
  loadingMore,
  onRetry,
  onRead,
  onLoadMore,
}: Props) {
  return (
    <section className={styles.section} aria-labelledby="booking-notifications-title">
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Immer auf dem Laufenden</p>
          <h2 id="booking-notifications-title">Benachrichtigungen</h2>
        </div>
        <Button variant="secondary" onClick={onRetry}>
          Aktualisieren
        </Button>
      </div>
      <p className={styles.intro}>
        Neue Anfragen und Neuigkeiten zu deinen Mieten findest du hier.
      </p>
      {typeof unreadCount === 'number' && (
        <p className={styles.count} role="status">
          {unreadCount === 0
            ? 'Alles gelesen.'
            : `${unreadCount} ungelesene ${unreadCount === 1 ? 'Benachrichtigung' : 'Benachrichtigungen'}`}
        </p>
      )}
      {readError && (
        <p role="alert">
          Der Lesestatus konnte nicht gespeichert werden. Bitte versuche es erneut.
        </p>
      )}
      {loading ? (
        <Spinner label="Benachrichtigungen werden geladen …" />
      ) : unavailable ? (
        <div className={styles.empty}>
          <p>
            Benachrichtigungen werden gerade eingerichtet. Deine Buchungen findest du weiterhin
            unter „Meine Mieten“ und „Eingehende Anfragen“.
          </p>
        </div>
      ) : (
        <>
          {error && (
            <div className={styles.empty} role="alert">
              <p>
                Benachrichtigungen konnten nicht aktualisiert werden. Bereits geladene Einträge
                bleiben sichtbar.
              </p>
              <Button variant="secondary" onClick={onRetry}>
                Erneut versuchen
              </Button>
            </div>
          )}
          {!error && notifications.length === 0 && (
            <div className={styles.empty}>
              <h3>Du bist auf dem neuesten Stand</h3>
              <p>
                Sobald es eine neue Anfrage oder eine Änderung deiner Miete gibt, erscheint sie
                hier.
              </p>
            </div>
          )}
          {notifications.length > 0 && (
            <ul className={styles.list}>
              {notifications.map((notification) => {
                const text = notificationText[notification.type];
                const unread = !notification.readAt;
                return (
                  <li
                    key={notification.id}
                    className={`${styles.card} ${unread ? styles.unread : ''}`}
                  >
                    <div className={styles.cardHeading}>
                      <h3>{text.title}</h3>
                      {unread && <span className={styles.new}>Neu</span>}
                    </div>
                    <p className={styles.itemTitle}>{notification.itemTitle}</p>
                    <p>{text.body}</p>
                    <time dateTime={notification.createdAt}>
                      {new Intl.DateTimeFormat('de-DE', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(notification.createdAt))}
                    </time>
                    <div className={styles.actions}>
                      <Link
                        to={notificationDestination(notification.type)}
                        hash={`booking-${notification.bookingId}`}
                        onClick={() => {
                          if (unread) onRead([notification.id]);
                        }}
                      >
                        Anfrage öffnen →
                      </Link>
                      {unread && (
                        <Button
                          variant="secondary"
                          loading={readingId === notification.id}
                          disabled={!!readingId}
                          onClick={() => onRead([notification.id])}
                          aria-label={`${text.title}: als gelesen markieren`}
                        >
                          Als gelesen markieren
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {hasMore && (
            <Button variant="secondary" loading={loadingMore} onClick={onLoadMore}>
              Weitere Benachrichtigungen
            </Button>
          )}
        </>
      )}
    </section>
  );
}
