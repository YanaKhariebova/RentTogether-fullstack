import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
export const Route = createFileRoute('/account/bookings')({
  component: () => (
    <section>
      <h1>Anfragen</h1>
      <nav aria-label="Buchungen">
        <Link to="/account/bookings/my-rentals">Meine Mieten</Link>
        {' · '}
        <Link to="/account/bookings/incoming">Eingehende Anfragen</Link>
      </nav>
      <Outlet />
    </section>
  ),
});
