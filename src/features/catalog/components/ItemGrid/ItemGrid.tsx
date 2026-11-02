import type { ItemCardData } from '../../types/item';
import { ItemCard } from '../ItemCard/ItemCard';
import styles from './ItemGrid.module.css';

type ItemGridProps = {
  items: ItemCardData[];
  favoriteIds?: ReadonlySet<string>;
  favoriteBusy?: boolean;
  onFavoriteToggle?: (item: ItemCardData, isFavorite: boolean) => void;
};

export function ItemGrid({
  items,
  favoriteIds = new Set(),
  favoriteBusy = false,
  onFavoriteToggle,
}: ItemGridProps) {
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          isFavorite={favoriteIds.has(item.id)}
          favoriteBusy={favoriteBusy}
          onFavoriteToggle={onFavoriteToggle}
        />
      ))}
    </div>
  );
}
