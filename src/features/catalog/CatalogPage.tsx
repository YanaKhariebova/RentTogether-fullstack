import { useAuth } from '@clerk/react';
import { useMemo, useState } from 'react';
import { Button } from '@/shared/ui/atoms';
import { useCategoriesQuery } from '../items/api/useCategoriesQuery';
import { ItemGrid } from './components/ItemGrid/ItemGrid';
import { useCatalogItemsQuery } from './api/useCatalogItemsQuery';
import { useCatalogCitiesQuery } from './api/useCatalogCitiesQuery';
import { useFavoriteMutation, useFavoritesQuery } from '../favorites/api/useFavorites';
import { catalogPrice } from './model/catalogPrice';
import styles from './CatalogPage.module.css';

const pageSize = 9;

export function CatalogPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [areFiltersOpen, setAreFiltersOpen] = useState(false);
  const { data: categoriesData } = useCategoriesQuery();
  const { data: citiesData } = useCatalogCitiesQuery();
  const normalizedMin = catalogPrice(minPrice);
  const normalizedMax = catalogPrice(maxPrice);
  const priceError =
    normalizedMin === null || normalizedMax === null
      ? 'Bitte gib einen gültigen Preis mit höchstens zwei Nachkommastellen ein.'
      : normalizedMin && normalizedMax && Number(normalizedMin) > Number(normalizedMax)
        ? 'Der Mindestpreis darf nicht höher als der Höchstpreis sein.'
        : null;
  const catalogQuery = useMemo(
    () => ({
      q: search.trim() || undefined,
      city: city || undefined,
      categoryId: category || undefined,
      minPrice: normalizedMin ?? undefined,
      maxPrice: normalizedMax ?? undefined,
      page: currentPage,
      limit: pageSize,
    }),
    [category, city, currentPage, normalizedMax, normalizedMin, search],
  );
  const {
    data: catalogData,
    isPending,
    isError,
    error,
    refetch,
  } = useCatalogItemsQuery(catalogQuery, !priceError);
  const favoritesQuery = useFavoritesQuery();
  const favoriteMutation = useFavoriteMutation();
  const favoriteIds = useMemo(
    () => new Set((favoritesQuery.data?.items ?? []).map((item) => item.id)),
    [favoritesQuery.data?.items],
  );

  const cityOptions = useMemo(
    () => [
      { value: '', label: 'Alle Städte' },
      ...(citiesData?.cities ?? []).map((itemCity) => ({ value: itemCity, label: itemCity })),
    ],
    [citiesData],
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

  function changeFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setCurrentPage(1);
  }

  const items = catalogData?.items ?? [];
  const totalPages = catalogData?.pagination.totalPages ?? 0;
  const activePage = catalogData?.pagination.page ?? currentPage;

  return (
    <section className={styles.page}>
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
              onChange={(event) => changeFilter(setSearch, event.target.value)}
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
              <select
                value={category}
                onChange={(event) => changeFilter(setCategory, event.target.value)}
              >
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
              <select value={city} onChange={(event) => changeFilter(setCity, event.target.value)}>
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
                  step="0.01"
                  placeholder="0"
                  value={minPrice}
                  onChange={(event) => changeFilter(setMinPrice, event.target.value)}
                />
              </label>
              <label>
                <span>Max. Preis (€)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="Beliebig"
                  value={maxPrice}
                  onChange={(event) => changeFilter(setMaxPrice, event.target.value)}
                />
              </label>
            </div>
          </div>

          <button
            type="button"
            className={styles.searchButton}
            aria-label="Suche ausführen"
            onClick={() => {
              setCurrentPage(1);
              if (!priceError) void refetch();
            }}
          >
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
                  onClick={() => changeFilter(setCategory, '')}
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
                      changeFilter(setCategory, category === option.value ? '' : option.value)
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
                  className={!city ? styles.isSelected : ''}
                  aria-pressed={!city}
                  onClick={() => changeFilter(setCity, '')}
                >
                  Alle Städte
                </button>
                {cityOptions.slice(1).map((option) => (
                  <label key={option.value}>
                    <input
                      type="radio"
                      name="catalog-city"
                      checked={city === option.value}
                      onChange={() => changeFilter(setCity, option.value)}
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
                    step="0.01"
                    placeholder="0"
                    value={minPrice}
                    onChange={(event) => changeFilter(setMinPrice, event.target.value)}
                  />
                </label>
                <label>
                  <span>Max. Preis (€)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="Beliebig"
                    value={maxPrice}
                    onChange={(event) => changeFilter(setMaxPrice, event.target.value)}
                  />
                </label>
              </div>
            </section>
          </aside>

          <div>
            {priceError ? (
              <p className={styles.empty} role="alert">
                {priceError}
              </p>
            ) : isPending ? (
              <p className={styles.empty}>Anzeigen werden geladen…</p>
            ) : isError ? (
              <div className={styles.empty} role="alert">
                <p>
                  {error instanceof Error
                    ? error.message
                    : 'Anzeigen konnten nicht geladen werden.'}
                </p>
                <Button onClick={() => void refetch()}>Erneut versuchen</Button>
              </div>
            ) : items.length > 0 ? (
              <>
                <ItemGrid
                  items={items}
                  favoriteIds={favoriteIds}
                  favoriteBusy={favoriteMutation.isPending}
                  onFavoriteToggle={
                    isLoaded && isSignedIn
                      ? (item, isFavorite) => favoriteMutation.mutate({ item, isFavorite })
                      : undefined
                  }
                />

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
    </section>
  );
}
