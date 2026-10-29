import type { ItemCardData } from '../../types/item';
import { ItemCard } from '../ItemCard/ItemCard';
import styles from './ItemGrid.module.css';

type ItemGridProps = {
  items: ItemCardData[];
};

export function ItemGrid({ items }: ItemGridProps) {
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
