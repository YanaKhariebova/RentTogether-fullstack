import { Link, useParams } from '@tanstack/react-router';
import { DateRangePicker } from '../bookings/components/DateRangePicker/DateRangePicker';
import { mockItems } from './mocks/items.mock';
import styles from './ItemDetailPage.module.css';

export function ItemDetailPage() {
  const { itemId } = useParams({ from: '/items/$itemId' });
  const item = mockItems.find((mockItem) => mockItem.id === itemId);

  if (!item) {
    return (
      <main className={styles.page}>
        <section className={styles.empty}>
          <h1>Anzeige nicht gefunden</h1>
          <Link to="/catalog">Zurück zum Katalog</Link>
        </section>
      </main>
    );
  }

  const imageUrl = item.images[0]?.url ?? 'https://picsum.photos/seed/rent-together/1200/900';
  const formattedPrice = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(item.pricePerDay));

  return (
    <main className={styles.page}>
      <section className={styles.content} aria-labelledby="item-title">
        <Link className={styles.backLink} to="/catalog">
          ← Zurück zu Entdecken
        </Link>

        <div className={styles.layout}>
          <img className={styles.image} src={imageUrl} alt={item.title} />

          <div className={styles.details}>
            <span className={styles.category}>{item.category.name}</span>
            <h1 id="item-title">{item.title}</h1>
            <p className={styles.city}>📍 {item.city}</p>
            <p className={styles.price}>{formattedPrice} / Tag</p>
            <p className={styles.description}>{item.description}</p>
            <p className={styles.owner}>Angeboten von {item.owner.name}</p>

            <DateRangePicker pricePerDay={item.pricePerDay} />
          </div>
        </div>
      </section>
    </main>
  );
}
