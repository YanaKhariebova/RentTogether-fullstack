import { ItemGrid } from './components/ItemGrid/ItemGrid';
import styles from './CatalogPage.module.css';

export function CatalogPage() {
  return (
    <main className={styles.page}>
      <section className={styles.section} aria-labelledby="catalog-title">
        <h1 id="catalog-title" className={styles.title}>
          Entdecken
        </h1>

        <ItemGrid />
      </section>
    </main>
  );
}
