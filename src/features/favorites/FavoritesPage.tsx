import { useTranslation } from 'react-i18next';
import { translate as t } from '../../i18n/config';
import { Link } from '@tanstack/react-router';
import { ItemGrid } from '@/features/catalog/components/ItemGrid/ItemGrid';
import { Button, Spinner } from '@/shared/ui/atoms';
import { useFavoriteMutation, useFavoritesQuery } from './api/useFavorites';
import styles from './FavoritesPage.module.css';

export function FavoritesPage() {
  useTranslation();
  const favoritesQuery = useFavoritesQuery();
  const favoriteMutation = useFavoriteMutation();
  const items = favoritesQuery.data?.items ?? [];
  const favoriteIds = new Set(items.map((item) => item.id));

  return (
    <section className={styles.page} aria-labelledby="favorites-title">
      <div className={styles.content}>
        <h1 id="favorites-title">{t('Favoriten')}</h1>
        <p className={styles.intro}>{t('Deine gespeicherten Anzeigen.')}</p>

        {favoritesQuery.isPending ? (
          <div className={styles.empty}>
            <Spinner label={t('Favoriten werden geladen …')} />
          </div>
        ) : favoritesQuery.isError ? (
          <div className={styles.empty}>
            <p role="alert">{t('Favoriten konnten nicht geladen werden.')}</p>
            <Button onClick={() => void favoritesQuery.refetch()}>{t('Erneut versuchen')}</Button>
          </div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            <p>{t('Du hast noch keine Favoriten gespeichert.')}</p>
            <Link to="/catalog">{t('Anzeigen entdecken')}</Link>
          </div>
        ) : (
          <ItemGrid
            items={items}
            favoriteIds={favoriteIds}
            favoriteBusy={favoriteMutation.isPending}
            onFavoriteToggle={(item, isFavorite) => favoriteMutation.mutate({ item, isFavorite })}
          />
        )}
        {favoriteMutation.isError && (
          <p role="alert">
            {t('Favoriten konnten nicht gespeichert werden. Bitte versuche es erneut.')}
          </p>
        )}
      </div>
    </section>
  );
}
