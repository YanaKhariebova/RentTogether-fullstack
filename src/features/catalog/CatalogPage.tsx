import { useMemo, useState } from 'react';
import { Input, Select } from '@/shared/ui/atoms';
import { ItemGrid } from './components/ItemGrid/ItemGrid';
import { mockItems } from './mocks/items.mock';
import styles from './CatalogPage.module.css';

export function CatalogPage() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');

  const cityOptions = useMemo(
    () => [
      { value: '', label: 'Alle Städte' },
      ...Array.from(new Set(mockItems.map((item) => item.city))).map((itemCity) => ({
        value: itemCity,
        label: itemCity,
      })),
    ],
    [],
  );

  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'Alle Kategorien' },
      ...Array.from(
        new Map(mockItems.map((item) => [item.category.id, item.category.name])).entries(),
      ).map(([id, name]) => ({ value: id, label: name })),
    ],
    [],
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('de-DE');

    return mockItems.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        `${item.title} ${item.description} ${item.city} ${item.category.name}`
          .toLocaleLowerCase('de-DE')
          .includes(normalizedSearch);
      const matchesCity = !city || item.city === city;
      const matchesCategory = !category || item.category.id === category;

      return matchesSearch && matchesCity && matchesCategory;
    });
  }, [category, city, search]);

  return (
    <main className={styles.page}>
      <section className={styles.section} aria-labelledby="catalog-title">
        <h1 id="catalog-title" className={styles.title}>
          Entdecken
        </h1>

        <div className={styles.filters}>
          <Input
            label="Wonach suchst du?"
            type="search"
            placeholder="Zum Beispiel Beamer oder Zelt"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            label="Stadt"
            options={cityOptions}
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
          <Select
            label="Kategorie"
            options={categoryOptions}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
        </div>

        <p className={styles.resultCount} aria-live="polite">
          {filteredItems.length} {filteredItems.length === 1 ? 'Anzeige' : 'Anzeigen'} gefunden
        </p>

        {filteredItems.length > 0 ? (
          <ItemGrid items={filteredItems} />
        ) : (
          <p className={styles.empty}>Keine passenden Anzeigen gefunden.</p>
        )}
      </section>
    </main>
  );
}
