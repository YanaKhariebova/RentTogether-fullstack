import { Link } from '@tanstack/react-router';
import styles from './HomePage.module.css';
export function HomePage() {
  return (
    <section className={styles.hero}>
      <span className={styles.eyebrow}>DEINE NACHBARSCHAFT. DEINE MÖGLICHKEITEN.</span>
      <h1>
        Für einen Moment gebraucht.
        <br />
        Zusammen möglich.
      </h1>
      <p>
        Der Beamer für den Filmabend. Das Werkzeug fürs Wochenende. Finde Dinge in deiner Nähe und
        teile, was du hast.
      </p>
      <div className={styles.actions}>
        <Link to="/catalog">
          Dinge entdecken <span aria-hidden="true">↗</span>
        </Link>
        <Link to="/account/items/new">Etwas verleihen</Link>
      </div>
      <div className={styles.note}>Lokal mieten. Ressourcen schonen.</div>
    </section>
  );
}
