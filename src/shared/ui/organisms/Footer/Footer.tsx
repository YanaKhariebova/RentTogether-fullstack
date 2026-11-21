import { useTranslation } from 'react-i18next';
import { translate as t } from '../../../../i18n/config';
import { Link } from '@tanstack/react-router';
import logo from '../../../assets/renttogether-icon.svg';
import styles from './Footer.module.css';

export function Footer() {
  useTranslation();
  const startYear = 2026;
  const currentYear = new Date().getFullYear();
  const copyrightYears = currentYear > startYear ? `${startYear}–${currentYear}` : `${startYear}`;
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.intro}>
          <Link to="/" className={styles.brand} aria-label={t('RentTogether – Startseite')}>
            <span
              className={styles.brandMark}
              aria-hidden="true"
              style={{ maskImage: 'url(' + logo + ')', WebkitMaskImage: 'url(' + logo + ')' }}
            />
            <span>
              <span className={styles.rent}>Rent</span>
              <span className={styles.together}>Together</span>
              <span className={styles.tagline}>{t('Weniger kaufen. Mehr teilen.')}</span>
            </span>
          </Link>
          <p className={styles.description}>
            {t(
              'Was du brauchst, gibt es vielleicht gleich nebenan. Entdecke Dinge in deiner Nähe und gib deinen eigenen neue Möglichkeiten.',
            )}
          </p>
          <span className={styles.note}>{t('Gemeinsam nutzen. Lokal verbinden.')}</span>
        </div>
        <nav className={styles.navigation} aria-label={t('Footernavigation')}>
          <div className={styles.group}>
            <h2>{t('Entdecken & teilen')}</h2>
            <ul>
              <li>
                <Link to="/catalog">{t('Dinge entdecken')}</Link>
              </li>
              <li>
                <Link to="/account/items/new">{t('Etwas verleihen')}</Link>
              </li>
              <li>
                <Link to="/account/items">{t('Meine Anzeigen')}</Link>
              </li>
              <li>
                <Link to="/so-funktionierts">{t('So funktioniert’s')}</Link>
              </li>
            </ul>
          </div>
          <div className={styles.group}>
            <h2>{t('Gut zu wissen')}</h2>
            <ul>
              <li>
                <Link to="/ueber-uns">{t('Über RentTogether')}</Link>
              </li>
              <li>
                <Link to="/hilfe">{t('Hilfe & häufige Fragen')}</Link>
              </li>
              <li>
                <Link to="/sicherheit">{t('Sicher leihen & verleihen')}</Link>
              </li>
            </ul>
          </div>
          <div className={styles.group}>
            <h2>{t('Rechtliches')}</h2>
            <ul>
              <li>
                <Link to="/datenschutz">{t('Datenschutz')}</Link>
              </li>
              <li>
                <Link to="/impressum">{t('Impressum')}</Link>
              </li>
            </ul>
          </div>
        </nav>
        <div className={styles.bottom}>
          <small>© {copyrightYears} RentTogether</small>
          <small>
            {t('Entwickelt von Olha Khodakivska, Yana Khariebova und Vladislav Nedbailo.')}
          </small>
          <a href="#main-content">
            {t('Zum Seitenanfang')} <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
