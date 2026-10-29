import { Link, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { DateRangePicker } from '../bookings/components/DateRangePicker/DateRangePicker';
import { mockBookings } from '../bookings/mocks/bookings.mock';
import { mockItems } from './mocks/items.mock';
import styles from './ItemDetailPage.module.css';

export function ItemDetailPage() {
  const { itemId } = useParams({ from: '/items/$itemId' });
  const item = mockItems.find((mockItem) => mockItem.id === itemId);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

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

  const images = [...item.images].sort(
    (firstImage, secondImage) => firstImage.order - secondImage.order,
  );
  const selectedImage = images.find((image) => image.id === selectedImageId) ?? images[0];
  const imageUrl = selectedImage?.url ?? 'https://picsum.photos/seed/rent-together/1200/900';
  const formattedPrice = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(item.pricePerDay));
  const unavailableRanges = mockBookings
    .filter(
      (booking) =>
        booking.itemId === item.id &&
        (booking.status === 'APPROVED' || booking.status === 'ACTIVE'),
    )
    .map(({ pickupDate, returnDate }) => ({ pickupDate, returnDate }));

  return (
    <main className={styles.page}>
      <section className={styles.content} aria-labelledby="item-title">
        <Link className={styles.backLink} to="/catalog">
          ← Zurück zu Entdecken
        </Link>

        <div className={styles.layout}>
          <section className={styles.gallery} aria-label={`Fotos: ${item.title}`}>
            <img className={styles.image} src={imageUrl} alt={item.title} />

            {images.length > 1 && (
              <div className={styles.thumbnails}>
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    className={image.id === selectedImage?.id ? styles.selectedThumbnail : ''}
                    aria-label={`Foto ${index + 1} anzeigen`}
                    aria-pressed={image.id === selectedImage?.id}
                    onClick={() => setSelectedImageId(image.id)}
                  >
                    <img src={image.url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <div className={styles.details}>
            <span className={styles.category}>{item.category.name}</span>
            <h1 id="item-title">{item.title}</h1>
            <p className={styles.city}>📍 {item.city}</p>
            <p className={styles.price}>{formattedPrice} / Tag</p>
            <p className={styles.description}>{item.description}</p>
            <p className={styles.owner}>Angeboten von {item.owner.name}</p>

            <DateRangePicker pricePerDay={item.pricePerDay} unavailableRanges={unavailableRanges} />
          </div>
        </div>
      </section>
    </main>
  );
}
