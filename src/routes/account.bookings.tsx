import { translate as t } from '../i18n/config';
import styles from '../features/bookings/BookingNavigation.module.css';
import { createFileRoute, Link, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/account/bookings')({
  component: () => (
    <section className={styles.page}>
      <h1>{t('Anfragen')}</h1>
      <nav aria-label={t('Buchungen')} className={styles.tabs}>
        <Link
          to="/account/bookings"
          activeOptions={{ exact: true }}
          activeProps={{ 'aria-current': 'page' }}
        >
          {t('Benachrichtigungen')}
        </Link>
        <Link to="/account/bookings/my-rentals" activeProps={{ 'aria-current': 'page' }}>
          {t('Meine Mieten')}
        </Link>
        <Link to="/account/bookings/incoming" activeProps={{ 'aria-current': 'page' }}>
          {t('Eingehende Anfragen')}
        </Link>
      </nav>
      <Outlet />
    </section>
  ),
});
