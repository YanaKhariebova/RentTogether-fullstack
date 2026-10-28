import { useMemo, useState } from 'react';
import { ItemGrid } from './components/ItemGrid/ItemGrid';
import { mockItems } from './mocks/items.mock';
import styles from './CatalogPage.module.css';

export function CatalogPage() {
  const [search, setSearch] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [areFiltersOpen, setAreFiltersOpen] = useState(false);

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
      const matchesCity = cities.length === 0 || cities.includes(item.city);
      const matchesCategory = !category || item.category.id === category;

      return matchesSearch && matchesCity && matchesCategory;
    });
  }, [category, cities, search]);

  function toggleCity(selectedCity: string) {
    setCities((currentCities) =>
      currentCities.includes(selectedCity)
        ? currentCities.filter((city) => city !== selectedCity)
        : [...currentCities, selectedCity],
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.section} aria-labelledby="catalog-title">
        <h1 id="catalog-title" className={styles.title}>
          Entdecken
        </h1>

        <div className={styles.filterPanel}>
          <label className={styles.searchField}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <input
              type="search"
              aria-label="Wonach suchst du?"
              placeholder="Wonach suchst du?"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <button
            type="button"
            className={styles.filterToggle}
            aria-label="Filter anzeigen"
            aria-expanded={areFiltersOpen}
            onClick={() => setAreFiltersOpen((isOpen) => !isOpen)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M7 12h10M10 17h4" />
              <circle cx="8" cy="7" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="12" cy="17" r="1.5" />
            </svg>
          </button>

          <div className={`${styles.filterControls} ${areFiltersOpen ? styles.filtersOpen : ''}`}>
            <label className={styles.selectField}>
              <span className={styles.srOnly}>Kategorie</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m7 10 5 5 5-5" />
              </svg>
            </label>

            <label className={styles.selectField}>
              <span className={styles.srOnly}>Stadt</span>
              <select
                value={cities.length === 1 ? cities[0] : ''}
                onChange={(event) => setCities(event.target.value ? [event.target.value] : [])}
              >
                {cityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m7 10 5 5 5-5" />
              </svg>
            </label>
          </div>

          <button type="button" className={styles.searchButton} aria-label="Suche ausführen">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
          </button>
        </div>

        <p className={styles.resultCount} aria-live="polite">
          {filteredItems.length} {filteredItems.length === 1 ? 'Anzeige' : 'Anzeigen'} gefunden
        </p>

        <div className={styles.catalogLayout}>
          <aside className={styles.sidebar} aria-label="Katalogfilter">
            <section className={styles.filterGroup}>
              <h2>Kategorie</h2>
              <div className={styles.categoryList}>
                <button
                  type="button"
                  className={!category ? styles.isSelected : ''}
                  aria-pressed={!category}
                  onClick={() => setCategory('')}
                >
                  Alle Kategorien
                </button>
                {categoryOptions.slice(1).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={category === option.value ? styles.isSelected : ''}
                    aria-pressed={category === option.value}
                    onClick={() =>
                      setCategory((currentCategory) =>
                        currentCategory === option.value ? '' : option.value,
                      )
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.filterGroup}>
              <h2>Stadt</h2>
              <div className={styles.cityList}>
                <button
                  type="button"
                  className={!cities.length ? styles.isSelected : ''}
                  aria-pressed={!cities.length}
                  onClick={() => setCities([])}
                >
                  Alle Städte
                </button>
                {cityOptions.slice(1).map((option) => (
                  <label key={option.value}>
                    <input
                      type="checkbox"
                      checked={cities.includes(option.value)}
                      onChange={() => toggleCity(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </section>
          </aside>

          <div>
            {filteredItems.length > 0 ? (
              <ItemGrid items={filteredItems} />
            ) : (
              <p className={styles.empty}>Keine passenden Anzeigen gefunden.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
