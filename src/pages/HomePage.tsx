import { useEffect, useRef } from 'react';
import { Link } from '@tanstack/react-router';
import styles from './HomePage.module.css';
export function HomePage() {
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
        <img src="/media/hero-brownstone.webp" alt="" fetchPriority="high" />
      </div>
      <div className={styles.content}>
        <span className={styles.eyebrow}>DEINE NACHBARSCHAFT. DEINE MÖGLICHKEITEN.</span>
        <h1>
          Für einen Moment gebraucht.
          <span className={styles.promise}>Zusammen möglich.</span>
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
      </div>
    </section>
  );
}
