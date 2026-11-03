import { Link } from '@tanstack/react-router';
import logo from '../../../assets/renttogether-icon.svg';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.intro}>
          <Link to="/" className={styles.brand} aria-label="RentTogether – Startseite">
            <span
              className={styles.brandMark}
              aria-hidden="true"
              style={{ maskImage: 'url(' + logo + ')', WebkitMaskImage: 'url(' + logo + ')' }}
            />
            <span>
              <span className={styles.rent}>Rent</span>
              <span className={styles.together}>Together</span>
              <span className={styles.tagline}>Weniger kaufen. Mehr teilen.</span>
            </span>
          </Link>
          <p className={styles.description}>
            Was du brauchst, gibt es vielleicht gleich nebenan. Entdecke Dinge in deiner Nähe und
            gib deinen eigenen neue Möglichkeiten.
          </p>
          <span className={styles.note}>Gemeinsam nutzen. Lokal verbinden.</span>
        </div>
        <nav className={styles.navigation} aria-label="Footernavigation">
          <div className={styles.group}>
            <h2>Entdecken & teilen</h2>
            <ul>
              <li>
                <Link to="/catalog">Dinge entdecken</Link>
              </li>
              <li>
                <Link to="/account/items/new">Etwas verleihen</Link>
              </li>
              <li>
                <Link to="/account/items">Meine Anzeigen</Link>
              </li>
              <li>
                <Link to="/so-funktionierts">So funktioniert’s</Link>
              </li>
            </ul>
          </div>
          <div className={styles.group}>
            <h2>Gut zu wissen</h2>
            <ul>
              <li>
                <Link to="/ueber-uns">Über RentTogether</Link>
              </li>
              <li>
                <Link to="/hilfe">Hilfe & häufige Fragen</Link>
              </li>
              <li>
                <Link to="/sicherheit">Sicher leihen & verleihen</Link>
              </li>
            </ul>
          </div>
          <div className={styles.group}>
            <h2>Rechtliches</h2>
            <ul>
              <li>
                <Link to="/datenschutz">Datenschutz</Link>
              </li>
              <li>
                <Link to="/impressum">Impressum</Link>
              </li>
            </ul>
          </div>
        </nav>
        <div className={styles.bottom}>
          <small>© {new Date().getFullYear()} RentTogether</small>
          <small>Entwickelt von Olha Khodakivska, Yana Khariebova und Vladislav Nedbailo.</small>
          <a href="#main-content">
            Zum Seitenanfang <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
