import type { ReactNode } from 'react';
import { Footer } from '../../organisms/Footer/Footer';
import { Header } from '../../organisms/Header/Header';
import styles from './PageLayout.module.css';
export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <a href="#main-content" className={styles.skip}>
        Zum Inhalt springen
      </a>
      <Header />
      <main id="main-content" className={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
