import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { catalogPrice } from './catalogPrice';

const pageSize = 9;

export function useCatalogFilters() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [areFiltersOpen, setAreFiltersOpen] = useState(false);
  const [areCategoriesExpanded, setAreCategoriesExpanded] = useState(false);
  const [areCitiesExpanded, setAreCitiesExpanded] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  const normalizedMin = catalogPrice(minPrice);
  const normalizedMax = catalogPrice(maxPrice);
  const priceError =
    normalizedMin === null || normalizedMax === null
      ? 'Bitte gib einen gültigen Preis mit höchstens zwei Nachkommastellen ein.'
      : normalizedMin && normalizedMax && Number(normalizedMin) > Number(normalizedMax)
        ? 'Der Mindestpreis darf nicht höher als der Höchstpreis sein.'
        : null;
  const query = useMemo(
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

  function changeFilter(setter: Dispatch<SetStateAction<string>>, value: string) {
    setter(value);
    setCurrentPage(1);
  }

  return {
    search,
    city,
    category,
    minPrice,
    maxPrice,
    currentPage,
    areFiltersOpen,
    areCategoriesExpanded,
    areCitiesExpanded,
    citySearch,
    priceError,
    query,
    setSearch,
    setCity,
    setCategory,
    setMinPrice,
    setMaxPrice,
    setCurrentPage,
    setAreFiltersOpen,
    setAreCategoriesExpanded,
    setAreCitiesExpanded,
    setCitySearch,
    changeFilter,
  };
}
