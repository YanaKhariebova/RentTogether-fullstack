import type { ReactNode } from 'react';
import { Header } from '../../organisms/Header/Header';
import styles from './PageLayout.module.css';
export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main-content" className={styles.skip}>
        Zum Inhalt springen
      </a>
      <Header />
      <main id="main-content" className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer}>RentTogether · Gemeinsam nutzen, gemeinsam sparen.</footer>
    </>
  );
}
