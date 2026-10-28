import { Link } from '@tanstack/react-router';
import type { ItemCardData } from '../../types/item';
import styles from './ItemCard.module.css';

type ItemCardProps = {
  item: ItemCardData;
};

export function ItemCard({ item }: ItemCardProps) {
  const imageUrl = item.images[0]?.url ?? 'https://picsum.photos/seed/rent-together/800/600';

  const formattedPrice = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(item.pricePerDay));

  return (
    <Link className={styles.link} to="/items/$itemId" params={{ itemId: item.id }}>
      <article className={styles.card}>
        <img className={styles.image} src={imageUrl} alt={item.title} />

        <div className={styles.content}>
          <h2 className={styles.title}>{item.title}</h2>

          <p className={styles.city}>📍 {item.city}</p>

          <div className={styles.footer}>
            <span className={styles.category}>{item.category.name}</span>

            <strong className={styles.price}>{formattedPrice} / Tag</strong>
          </div>
        </div>
      </article>
    </Link>
  );
}
