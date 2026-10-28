import { Link } from '@tanstack/react-router';
export function NotFoundPage() {
  return (
    <section>
      <h1>Seite nicht gefunden</h1>
      <p>Diese Seite gibt es leider nicht.</p>
      <Link to="/">Zur Startseite</Link>
    </section>
  );
}
