import { mockItems } from '../../mocks/items.mock';
import { ItemCard } from '../ItemCard/ItemCard';
import styles from './ItemGrid.module.css';

export function ItemGrid() {
  return (
    <div className={styles.grid}>
      {mockItems.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
