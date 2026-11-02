import { Link } from '@tanstack/react-router';
import { ItemGrid } from '@/features/catalog/components/ItemGrid/ItemGrid';
import { useFavoriteMutation, useFavoritesQuery } from './api/useFavorites';
import styles from './FavoritesPage.module.css';

export function FavoritesPage() {
  const favoritesQuery = useFavoritesQuery();
  const favoriteMutation = useFavoriteMutation();
  const items = favoritesQuery.data?.items ?? [];
  const favoriteIds = new Set(items.map((item) => item.id));

  return (
    <section className={styles.page} aria-labelledby="favorites-title">
      <div className={styles.content}>
        <h1 id="favorites-title">Beobachtungsliste</h1>
        <p className={styles.intro}>Anzeigen, die du beobachten möchtest.</p>

        {favoritesQuery.isPending ? (
          <p className={styles.empty}>Beobachtungsliste wird geladen…</p>
        ) : favoritesQuery.isError ? (
          <p className={styles.empty} role="alert">
            Beobachtungsliste konnte nicht geladen werden.
          </p>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            <p>Du beobachtest noch keine Anzeigen.</p>
            <Link to="/catalog">Anzeigen entdecken</Link>
          </div>
        ) : (
          <ItemGrid
            items={items}
            favoriteIds={favoriteIds}
            favoriteBusy={favoriteMutation.isPending}
            onFavoriteToggle={(item, isFavorite) => favoriteMutation.mutate({ item, isFavorite })}
          />
        )}
      </div>
    </section>
  );
}
