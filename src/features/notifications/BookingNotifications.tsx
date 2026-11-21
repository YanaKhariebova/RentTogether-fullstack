import { formatLocale } from '../../i18n/config';
import { useTranslation } from 'react-i18next';
import { translate as t } from '../../i18n/config';
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
  useTranslation();
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
  useTranslation();
  return (
    <section className={styles.section} aria-labelledby="booking-notifications-title">
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>{t('Immer auf dem Laufenden')}</p>
          <h2 id="booking-notifications-title">{t('Benachrichtigungen')}</h2>
        </div>
        <Button variant="secondary" onClick={onRetry}>
          {t('Aktualisieren')}
        </Button>
      </div>
      <p className={styles.intro}>
        {t('Neue Anfragen und Neuigkeiten zu deinen Mieten findest du hier.')}
      </p>
      {typeof unreadCount === 'number' && (
        <p className={styles.count} role="status">
          {unreadCount === 0 ? t('Alles gelesen.') : t('unreadCount', { count: unreadCount })}
        </p>
      )}
      {readError && (
        <p role="alert">
          {t('Der Lesestatus konnte nicht gespeichert werden. Bitte versuche es erneut.')}
        </p>
      )}
      {loading ? (
        <Spinner label={t('Benachrichtigungen werden geladen …')} />
      ) : unavailable ? (
        <div className={styles.empty}>
          <p>
            {t(
              'Benachrichtigungen werden gerade eingerichtet. Deine Buchungen findest du weiterhin unter „Meine Mieten“ und „Eingehende Anfragen“.',
            )}
          </p>
        </div>
      ) : (
        <>
          {error && (
            <div className={styles.empty} role="alert">
              <p>
                {t(
                  'Benachrichtigungen konnten nicht aktualisiert werden. Bereits geladene Einträge bleiben sichtbar.',
                )}
              </p>
              <Button variant="secondary" onClick={onRetry}>
                {t('Erneut versuchen')}
              </Button>
            </div>
          )}
          {!error && notifications.length === 0 && (
            <div className={styles.empty}>
              <h3>{t('Du bist auf dem neuesten Stand')}</h3>
              <p>
                {t(
                  'Sobald es eine neue Anfrage oder eine Änderung deiner Miete gibt, erscheint sie hier.',
                )}
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
                      <h3>{t(text.title)}</h3>
                      {unread && <span className={styles.new}>{t('Neu')}</span>}
                    </div>
                    <p className={styles.itemTitle}>{notification.itemTitle}</p>
                    <p>{t(text.body)}</p>
                    <time dateTime={notification.createdAt}>
                      {new Intl.DateTimeFormat(formatLocale(), {
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
                        {t('Anfrage öffnen →')}
                      </Link>
                      {unread && (
                        <Button
                          variant="secondary"
                          loading={readingId === notification.id}
                          disabled={!!readingId}
                          onClick={() => onRead([notification.id])}
                          aria-label={t('{{value0}}: als gelesen markieren', {
                            value0: t(text.title),
                          })}
                        >
                          {t('Als gelesen markieren')}
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
              {t('Weitere Benachrichtigungen')}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
