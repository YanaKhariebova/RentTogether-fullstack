import { useMemo, useState } from 'react';
import { Button } from '@/shared/ui/atoms';
import { ItemGrid } from './components/ItemGrid/ItemGrid';
import { mockItems } from './mocks/items.mock';
import styles from './CatalogPage.module.css';

const pageSize = 9;

export function CatalogPage() {
  const [search, setSearch] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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
      const price = Number(item.pricePerDay);
      const matchesMinPrice = !minPrice || price >= Number(minPrice);
      const matchesMaxPrice = !maxPrice || price <= Number(maxPrice);

      return matchesSearch && matchesCity && matchesCategory && matchesMinPrice && matchesMaxPrice;
    });
  }, [category, cities, maxPrice, minPrice, search]);

  function toggleCity(selectedCity: string) {
    setCities((currentCities) =>
      currentCities.includes(selectedCity)
        ? currentCities.filter((city) => city !== selectedCity)
        : [...currentCities, selectedCity],
    );
  }

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedItems = filteredItems.slice((activePage - 1) * pageSize, activePage * pageSize);

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

            <div className={styles.mobilePriceRange}>
              <label>
                <span>Min. Preis (€)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  placeholder="0"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                />
              </label>
              <label>
                <span>Max. Preis (€)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  placeholder="Beliebig"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                />
              </label>
            </div>
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

            <section className={styles.filterGroup}>
              <h2>Preis pro Tag</h2>
              <div className={styles.sidebarPriceRange}>
                <label>
                  <span>Min. Preis (€)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    placeholder="0"
                    value={minPrice}
                    onChange={(event) => setMinPrice(event.target.value)}
                  />
                </label>
                <label>
                  <span>Max. Preis (€)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    placeholder="Beliebig"
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                  />
                </label>
              </div>
            </section>
          </aside>

          <div>
            {filteredItems.length > 0 ? (
              <>
                <ItemGrid items={paginatedItems} />

                {totalPages > 1 && (
                  <nav className={styles.pagination} aria-label="Seitennavigation">
                    <Button
                      variant="secondary"
                      disabled={activePage === 1}
                      onClick={() => setCurrentPage((page) => page - 1)}
                    >
                      Zurück
                    </Button>
                    <div className={styles.pageNumbers}>
                      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          className={page === activePage ? styles.currentPage : ''}
                          aria-label={`Seite ${page}`}
                          aria-current={page === activePage ? 'page' : undefined}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="secondary"
                      disabled={activePage === totalPages}
                      onClick={() => setCurrentPage((page) => page + 1)}
                    >
                      Weiter
                    </Button>
                  </nav>
                )}
              </>
            ) : (
              <p className={styles.empty}>Keine passenden Anzeigen gefunden.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
