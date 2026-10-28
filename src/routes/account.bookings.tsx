import { createFileRoute, Link, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/account/bookings')({
  component: () => (
    <section>
      <h1>Anfragen</h1>
      <nav aria-label="Buchungen">
        <Link to="/account/bookings/my-rentals" activeProps={{ 'aria-current': 'page' }}>
          Meine Mieten
        </Link>
        {' · '}
        <Link to="/account/bookings/incoming" activeProps={{ 'aria-current': 'page' }}>
          Eingehende Anfragen
        </Link>
      </nav>
      <Outlet />
    </section>
  ),
});
