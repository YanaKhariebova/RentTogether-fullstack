import { ApiError } from '@/shared/api/client';
import { Button, IconButton, Spinner } from '@/shared/ui/atoms';
import { useAuth } from '@clerk/react';
import { Link, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { DateRangePicker } from '../bookings/components/DateRangePicker/DateRangePicker';
import { useCreateBookingMutation } from '../bookings/api/useCreateBookingMutation';
import { useUnavailableDatesQuery } from '../bookings/api/useUnavailableDatesQuery';
import { useItemDetailQuery } from './api/useItemDetailQuery';
import { useFavoriteMutation, useFavoritesQuery } from '../favorites/api/useFavorites';
import styles from './ItemDetailPage.module.css';

export function ItemDetailPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { itemId } = useParams({ from: '/items/$itemId' });
  const { data, isPending, isError, error, refetch } = useItemDetailQuery(itemId);
  const createBooking = useCreateBookingMutation();
  const unavailableDates = useUnavailableDatesQuery(itemId);
  const favoritesQuery = useFavoritesQuery();
  const favoriteMutation = useFavoriteMutation();
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  if (isPending) {
    return (
      <section className={styles.page}>
        <section className={styles.empty}>
          <Spinner label="Anzeige wird geladen …" />
        </section>
      </section>
    );
  }

  if (isError && !(error instanceof ApiError && [400, 404].includes(error.status)))
    return (
      <section className={styles.page}>
        <div className={styles.empty} role="alert">
          <h1>Anzeige konnte nicht geladen werden</h1>
          <p>{error.message}</p>
          <Button onClick={() => void refetch()}>Erneut versuchen</Button>
        </div>
      </section>
    );
  if (isError || !data) {
    return (
      <section className={styles.page}>
        <section className={styles.empty}>
          <h1>Anzeige nicht gefunden</h1>
          <Link to="/catalog">Zurück zum Katalog</Link>
        </section>
      </section>
    );
  }

  const item = data.item;
  const images = [...item.images].sort(
    (firstImage, secondImage) => firstImage.order - secondImage.order,
  );
  const selectedImage = images.find((image) => image.id === selectedImageId) ?? images[0];
  const imageUrl = selectedImage?.url ?? 'https://picsum.photos/seed/rent-together/1200/900';
  const formattedPrice = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(item.pricePerDay));
  const unavailableRanges = unavailableDates.data?.ranges ?? [];
  const isFavorite = (favoritesQuery.data?.items ?? []).some((favorite) => favorite.id === item.id);

  return (
    <section className={styles.page}>
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
            <div className={styles.titleRow}>
              <h1 id="item-title">{item.title}</h1>
              <IconButton
                className={styles.favorite}
                label={
                  !isLoaded || !isSignedIn
                    ? 'Bitte melde dich an, um Favoriten zu speichern.'
                    : isFavorite
                      ? `${item.title} aus Favoriten entfernen`
                      : `${item.title} zu Favoriten hinzufügen`
                }
                aria-pressed={isFavorite}
                aria-busy={favoriteMutation.isPending || undefined}
                disabled={!isLoaded || !isSignedIn || favoriteMutation.isPending}
                onClick={() => favoriteMutation.mutate({ item, isFavorite })}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.6a5.5 5.5 0 0 0-.1-7.8Z" />
                </svg>
              </IconButton>
            </div>
            {favoriteMutation.isError && (
              <p role="alert">
                Favoriten konnten nicht gespeichert werden. Bitte versuche es erneut.
              </p>
            )}
            <p className={styles.city}>📍 {item.city}</p>
            <p className={styles.price}>{formattedPrice} / Tag</p>
            <p className={styles.description}>{item.description}</p>
            <p className={styles.owner}>Angeboten von {item.owner.name}</p>

            {unavailableDates.isPending ? (
              <Spinner label="Verfügbarkeit wird geladen …" />
            ) : unavailableDates.isError ? (
              <div role="alert">
                <p>Die Verfügbarkeit konnte nicht geladen werden. Bitte versuche es erneut.</p>
                <Button onClick={() => void unavailableDates.refetch()}>
                  Verfügbarkeit erneut laden
                </Button>
              </div>
            ) : (
              <DateRangePicker
                pricePerDay={item.pricePerDay}
                unavailableRanges={unavailableRanges}
                isSubmitting={createBooking.isPending}
                isSubmitted={createBooking.isSuccess}
                errorMessage={
                  createBooking.error instanceof Error ? createBooking.error.message : null
                }
                onSubmit={async (dates) => {
                  try {
                    await createBooking.mutateAsync({ itemId: item.id, ...dates });
                  } catch {
                    // The mutation's error is shown in the booking form above.
                  }
                }}
              />
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
