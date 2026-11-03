import styles from '../features/bookings/BookingNavigation.module.css';
import { createFileRoute, Link, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/account/bookings')({
  component: () => (
    <section className={styles.page}>
      <h1>Anfragen</h1>
      <nav aria-label="Buchungen" className={styles.tabs}>
        <Link
          to="/account/bookings"
          activeOptions={{ exact: true }}
          activeProps={{ 'aria-current': 'page' }}
        >
          Benachrichtigungen
        </Link>
        <Link to="/account/bookings/my-rentals" activeProps={{ 'aria-current': 'page' }}>
          Meine Mieten
        </Link>
        <Link to="/account/bookings/incoming" activeProps={{ 'aria-current': 'page' }}>
          Eingehende Anfragen
        </Link>
      </nav>
      <Outlet />
    </section>
  ),
});
