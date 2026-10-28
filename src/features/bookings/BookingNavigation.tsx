import { Link } from '@tanstack/react-router';

export function BookingNavigation() {
  return (
    <nav aria-label="Buchungen">
      <Link to="/account/rentals" activeProps={{ 'aria-current': 'page' }}>
        Meine Mieten
      </Link>
      {' · '}
      <Link to="/account/requests" activeProps={{ 'aria-current': 'page' }}>
        Eingehende Anfragen
      </Link>
    </nav>
  );
}
