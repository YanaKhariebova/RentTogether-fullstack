import { useTranslation } from 'react-i18next';
import { translate as t } from '../i18n/config';
import { useEffect, useRef } from 'react';
import { Link } from '@tanstack/react-router';
import styles from './HomePage.module.css';
export function HomePage() {
  useTranslation();
  const hero = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = document.querySelector('header');
    const observer = new ResizeObserver(() => {
      if (header)
        hero.current?.style.setProperty(
          '--hero-header-height',
          `${header.getBoundingClientRect().height}px`,
        );
    });
    if (header) observer.observe(header);
    return () => observer.disconnect();
  }, []);
  return (
    <section ref={hero} className={styles.hero}>
      <div className={styles.backdrop} aria-hidden="true">
        <picture>
          <source
            media="(max-width: 767px)"
            srcSet="/media/hero-mobile-golden-640.webp 640w, /media/hero-mobile-golden-960.webp 960w"
            sizes="100vw"
          />
          <img src="/media/hero-brownstone.webp" alt="" fetchPriority="high" />
        </picture>
      </div>
      <div className={styles.content}>
        <span className={styles.eyebrow}>{t('DEINE NACHBARSCHAFT. DEINE MÖGLICHKEITEN.')}</span>
        <h1>
          <span className={styles.headlineLead}>{t('Leihen, was du brauchst.')}</span>{' '}
          <span className={styles.promise}>{t('Teilen, was du hast.')}</span>
        </h1>
        <p>
          {t(
            'Finde Dinge in deiner Nähe – vom Beamer bis zum Werkzeug. Oder vermiete unkompliziert, was du gerade nicht brauchst.',
          )}
        </p>
        <div className={styles.actions}>
          <Link to="/catalog">
            {t('Dinge entdecken')} <span aria-hidden="true">↗</span>
          </Link>
          <Link to="/account/items/new">{t('Etwas verleihen')}</Link>
        </div>
      </div>
    </section>
  );
}
