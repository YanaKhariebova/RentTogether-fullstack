import { useMemo, useState } from 'react';
import { Button } from '@/shared/ui/atoms';
import { useCategoriesQuery } from '../items/api/useCategoriesQuery';
import { ItemGrid } from './components/ItemGrid/ItemGrid';
import { useCatalogItemsQuery } from './api/useCatalogItemsQuery';
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
  const { data: categoriesData } = useCategoriesQuery();
  const catalogQuery = useMemo(
    () => ({
      q: search.trim() || undefined,
      city: cities[0] || undefined,
      categoryId: category || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      page: currentPage,
      limit: pageSize,
    }),
    [category, cities, currentPage, maxPrice, minPrice, search],
  );
  const { data: catalogData, isPending, isError } = useCatalogItemsQuery(catalogQuery);

  const cityOptions = useMemo(
    () => [
      { value: '', label: 'Alle Städte' },
      ...Array.from(new Set((catalogData?.items ?? []).map((item) => item.city))).map(
        (itemCity) => ({
          value: itemCity,
          label: itemCity,
        }),
      ),
    ],
    [catalogData],
  );

  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'Alle Kategorien' },
      ...(categoriesData?.categories ?? []).map((categoryItem) => ({
        value: categoryItem.id,
        label: categoryItem.name,
      })),
    ],
    [categoriesData],
  );

  function toggleCity(selectedCity: string) {
    setCities((currentCities) =>
      currentCities.includes(selectedCity)
        ? currentCities.filter((city) => city !== selectedCity)
        : [...currentCities, selectedCity],
    );
  }

  const items = catalogData?.items ?? [];
  const totalPages = catalogData?.pagination.totalPages ?? 0;
  const activePage = catalogData?.pagination.page ?? currentPage;

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
          {catalogData?.pagination.total ?? 0}{' '}
          {catalogData?.pagination.total === 1 ? 'Anzeige' : 'Anzeigen'} gefunden
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
            {isPending ? (
              <p className={styles.empty}>Anzeigen werden geladen…</p>
            ) : isError ? (
              <p className={styles.empty}>Anzeigen konnten nicht geladen werden.</p>
            ) : items.length > 0 ? (
              <>
                <ItemGrid items={items} />

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
