import { Link } from '@tanstack/react-router';
import styles from './MessagesPage.module.css';

export function MessagesPage() {
  return (
    <section className={styles.page} aria-labelledby="messages-title">
      <div className={styles.content}>
        <h1 id="messages-title">Nachrichten</h1>
        <p className={styles.intro}>Deine Unterhaltungen zu Anfragen und Ausleihen.</p>

        <div className={styles.empty}>
          <h2>Noch keine Nachrichten</h2>
          <p>Sobald es zu einer Anfrage etwas zu besprechen gibt, erscheint der Chat hier.</p>
          <Link to="/account/bookings/my-rentals">Meine Anfragen ansehen</Link>
        </div>
      </div>
    </section>
  );
}
