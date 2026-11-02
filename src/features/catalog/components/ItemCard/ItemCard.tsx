import { Link } from '@tanstack/react-router';
import type { ItemCardData } from '../../types/item';
import styles from './ItemCard.module.css';

type ItemCardProps = {
  item: ItemCardData;
  isFavorite?: boolean;
  favoriteBusy?: boolean;
  onFavoriteToggle?: (item: ItemCardData, isFavorite: boolean) => void;
};

export function ItemCard({
  item,
  isFavorite = false,
  favoriteBusy = false,
  onFavoriteToggle,
}: ItemCardProps) {
  const imageUrl = item.images[0]?.url ?? 'https://picsum.photos/seed/rent-together/800/600';

  const formattedPrice = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(item.pricePerDay));

  return (
    <article className={styles.card}>
      <Link className={styles.link} to="/items/$itemId" params={{ itemId: item.id }}>
        <img className={styles.image} src={imageUrl} alt={item.title} />

        <div className={styles.content}>
          <h2 className={styles.title}>{item.title}</h2>

          <p className={styles.city}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
              <circle cx="12" cy="10" r="2" />
            </svg>
            {item.city}
          </p>

          <div className={styles.footer}>
            <span className={styles.category}>{item.category.name}</span>

            <strong className={styles.price}>{formattedPrice} / Tag</strong>
          </div>
        </div>
      </Link>

      <button
        type="button"
        className={styles.favorite}
        aria-label={
          !onFavoriteToggle
            ? 'Bitte melde dich an, um Favoriten zu speichern.'
            : isFavorite
              ? `${item.title} aus Favoriten entfernen`
              : `${item.title} zu Favoriten hinzufügen`
        }
        aria-pressed={isFavorite}
        aria-busy={favoriteBusy || undefined}
        disabled={!onFavoriteToggle || favoriteBusy}
        onClick={() => onFavoriteToggle?.(item, isFavorite)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.6a5.5 5.5 0 0 0-.1-7.8Z" />
        </svg>
      </button>
    </article>
  );
}
