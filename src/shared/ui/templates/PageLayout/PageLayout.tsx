import type { ReactNode } from 'react';
import { Footer } from '../../organisms/Footer/Footer';
import styles from './PageLayout.module.css';
export function PageLayout({ children, header }: { children: ReactNode; header: ReactNode }) {
  return (
    <div className={styles.layout}>
      <a href="#main-content" className={styles.skip}>
        Zum Inhalt springen
      </a>
      {header}
      <main id="main-content" className={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
