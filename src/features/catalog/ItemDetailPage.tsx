import { formatLocale } from '../../i18n/config';
import { useTranslation } from 'react-i18next';
import { translate as t } from '../../i18n/config';
import { ApiError } from '@/shared/api/client';
import { Button, IconButton, Spinner, Textarea } from '@/shared/ui/atoms';
import { useAuth } from '@clerk/react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { DateRangePicker } from '../bookings/components/DateRangePicker/DateRangePicker';
import { useCreateBookingMutation } from '../bookings/api/useCreateBookingMutation';
import { useUnavailableDatesQuery } from '../bookings/api/useUnavailableDatesQuery';
import { useItemDetailQuery } from './api/useItemDetailQuery';
import { useFavoriteMutation, useFavoritesQuery } from '../favorites/api/useFavorites';
import { useCurrentUser } from '../profile/api/useCurrentUser';
import { useSendItemInquiryMutation } from '../messages/api/useConversations';
import { type ItemReportReason, useReportItemMutation } from './api/useReportItemMutation';
import styles from './ItemDetailPage.module.css';

export function ItemDetailPage() {
  useTranslation();
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const { itemId } = useParams({ from: '/items/$itemId' });
  const { data, isPending, isError, error, refetch } = useItemDetailQuery(itemId);
  const createBooking = useCreateBookingMutation();
  const unavailableDates = useUnavailableDatesQuery(itemId);
  const favoritesQuery = useFavoritesQuery();
  const favoriteMutation = useFavoriteMutation();
  const currentUser = useCurrentUser();
  const inquiry = useSendItemInquiryMutation(itemId);
  const reportItem = useReportItemMutation(itemId);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryBody, setInquiryBody] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ItemReportReason>('Unangemessener Inhalt');
  const [reportDetails, setReportDetails] = useState('');

  if (isPending) {
    return (
      <section className={styles.page}>
        <section className={styles.empty}>
          <Spinner label={t('Anzeige wird geladen …')} />
        </section>
      </section>
    );
  }

  if (isError && !(error instanceof ApiError && [400, 404].includes(error.status)))
    return (
      <section className={styles.page}>
        <div className={styles.empty} role="alert">
          <h1>{t('Anzeige konnte nicht geladen werden')}</h1>
          <p>{t(error.message)}</p>
          <Button onClick={() => void refetch()}>{t('Erneut versuchen')}</Button>
        </div>
      </section>
    );
  if (isError || !data) {
    return (
      <section className={styles.page}>
        <section className={styles.empty}>
          <h1>{t('Anzeige nicht gefunden')}</h1>
          <Link to="/catalog">{t('Zurück zum Katalog')}</Link>
        </section>
      </section>
    );
  }

  const item = data.item;
  const images = [...item.images].sort(
    (firstImage, secondImage) => firstImage.order - secondImage.order,
  );
  const selectedImage = images.find((image) => image.id === selectedImageId) ?? images[0];
  const selectedImageIndex = Math.max(
    0,
    images.findIndex((image) => image.id === selectedImage?.id),
  );
  const imageUrl = selectedImage?.url ?? 'https://picsum.photos/seed/rent-together/1200/900';
  const formattedPrice = new Intl.NumberFormat(formatLocale(), {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(item.pricePerDay));
  const unavailableRanges = unavailableDates.data?.ranges ?? [];
  const isFavorite = (favoritesQuery.data?.items ?? []).some((favorite) => favorite.id === item.id);
  const isOwnItem = currentUser.data?.user.id === item.owner.id;

  function selectAdjacentImage(direction: -1 | 1) {
    const nextIndex = (selectedImageIndex + direction + images.length) % images.length;
    setSelectedImageId(images[nextIndex]?.id ?? null);
  }

  return (
    <section className={styles.page}>
      <section className={styles.content} aria-labelledby="item-title">
        <Link className={styles.backLink} to="/catalog">
          {t('← Zurück zu Entdecken')}
        </Link>

        <div className={styles.layout}>
          <section
            className={styles.gallery}
            aria-label={`Fotos: ${item.title}`}
            aria-describedby={images.length > 1 ? 'gallery-keyboard-help' : undefined}
            tabIndex={images.length > 1 ? 0 : undefined}
            onKeyDown={(event) => {
              if (images.length < 2) return;
              if (event.key === 'ArrowLeft') {
                event.preventDefault();
                selectAdjacentImage(-1);
              }
              if (event.key === 'ArrowRight') {
                event.preventDefault();
                selectAdjacentImage(1);
              }
            }}
          >
            <img className={styles.image} src={imageUrl} alt={item.title} />

            {images.length > 1 && (
              <>
                <p id="gallery-keyboard-help" className={styles.srOnly}>
                  {t('Mit der linken und rechten Pfeiltaste zwischen Fotos wechseln.')}
                </p>
                <p className={styles.srOnly} aria-live="polite" aria-atomic="true">
                  {t('Foto')} {selectedImageIndex + 1} von {images.length}
                </p>
                <div className={styles.thumbnails}>
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      type="button"
                      className={image.id === selectedImage?.id ? styles.selectedThumbnail : ''}
                      aria-label={t('Foto {{value0}} anzeigen', { value0: index + 1 })}
                      aria-pressed={image.id === selectedImage?.id}
                      onClick={() => setSelectedImageId(image.id)}
                    >
                      <img src={image.url} alt="" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>

          <div className={styles.details}>
            <div className={styles.categoryRow}>
              <span className={styles.category}>{t(item.category.name)}</span>
              <IconButton
                className={styles.favorite}
                label={
                  !isLoaded || !isSignedIn
                    ? t('Bitte melde dich an, um Favoriten zu speichern.')
                    : isFavorite
                      ? t('{{value0}} aus Favoriten entfernen', { value0: item.title })
                      : t('{{value0}} zu Favoriten hinzufügen', { value0: item.title })
                }
                aria-pressed={isFavorite}
                aria-busy={favoriteMutation.isPending || undefined}
                disabled={
                  !isLoaded || !isSignedIn || favoritesQuery.isPending || favoriteMutation.isPending
                }
                onClick={() => favoriteMutation.mutate({ item, isFavorite })}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.6a5.5 5.5 0 0 0-.1-7.8Z" />
                </svg>
              </IconButton>
            </div>
            <div className={styles.titleRow}>
              <h1 id="item-title">{item.title}</h1>
            </div>
            {favoriteMutation.isError && (
              <p role="alert">
                {t('Favoriten konnten nicht gespeichert werden. Bitte versuche es erneut.')}
              </p>
            )}
            <p className={styles.city}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
                <circle cx="12" cy="10" r="2" />
              </svg>
              {item.city}
            </p>
            <p className={styles.price}>{formattedPrice} / Tag</p>
            <p className={styles.description}>{item.description}</p>
            <p className={styles.owner}>
              {t('Angeboten von')} {item.owner.name}
            </p>
            {isLoaded && isSignedIn && !isOwnItem && (
              <section className={styles.report} aria-label={t('Anzeige melden')}>
                <button
                  type="button"
                  className={styles.reportToggle}
                  onClick={() => setReportOpen((open) => !open)}
                  aria-expanded={reportOpen}
                >
                  {t('Anzeige melden')}
                </button>
                {reportOpen && (
                  <form
                    className={styles.reportForm}
                    onSubmit={(event) => {
                      event.preventDefault();
                      void reportItem
                        .mutateAsync({
                          reason: reportReason,
                          details: reportDetails,
                        })
                        .then(() => setReportOpen(false));
                    }}
                  >
                    <label>
                      {t('Grund')}{' '}
                      <select
                        value={reportReason}
                        onChange={(event) =>
                          setReportReason(event.target.value as ItemReportReason)
                        }
                      >
                        <option value="Unangemessener Inhalt">{t('Unangemessener Inhalt')}</option>
                        <option value="Betrug oder verdächtiges Angebot">
                          {t('Betrug oder verdächtiges Angebot')}
                        </option>
                        <option value="Verbotener Artikel">{t('Verbotener Artikel')}</option>
                        <option value="Falsche Angaben">{t('Falsche Angaben')}</option>
                        <option value="Anderer Grund">{t('Anderer Grund')}</option>
                      </select>
                    </label>
                    <Textarea
                      label={t('Zusätzliche Informationen (optional)')}
                      maxLength={500}
                      value={reportDetails}
                      onChange={(event) => setReportDetails(event.target.value)}
                    />
                    {reportItem.isError && (
                      <p role="alert">
                        {reportItem.error instanceof Error
                          ? reportItem.error.message
                          : t('Die Meldung konnte nicht gesendet werden.')}
                      </p>
                    )}
                    <Button type="submit" loading={reportItem.isPending}>
                      {t('Meldung senden')}
                    </Button>
                  </form>
                )}
              </section>
            )}
            {isLoaded && isSignedIn && !isOwnItem && (
              <div className={styles.inquiry}>
                <Button
                  variant="secondary"
                  className={styles.inquiryButton}
                  onClick={() => setInquiryOpen((open) => !open)}
                >
                  <span aria-hidden="true">✉</span> {t('Nachricht schreiben')}
                </Button>
                {inquiryOpen && (
                  <form
                    className={styles.inquiryForm}
                    onSubmit={(event) => {
                      event.preventDefault();
                      const body = inquiryBody.trim();
                      if (!body) return;
                      void inquiry.mutateAsync(body).then(({ conversation }) =>
                        navigate({
                          to: '/account/messages/$conversationId',
                          params: { conversationId: conversation.id },
                        }),
                      );
                    }}
                  >
                    <Textarea
                      label={t('Nachricht an den Anbieter')}
                      value={inquiryBody}
                      maxLength={2000}
                      placeholder={t('Frage {{value0}} etwas zu diesem Artikel …', {
                        value0: item.owner.name,
                      })}
                      onChange={(event) => setInquiryBody(event.target.value)}
                    />
                    {inquiry.isError && (
                      <p role="alert">{t('Die Nachricht konnte nicht gesendet werden.')}</p>
                    )}
                    <Button
                      type="submit"
                      loading={inquiry.isPending}
                      disabled={!inquiryBody.trim()}
                    >
                      {t('Nachricht senden')}
                    </Button>
                  </form>
                )}
              </div>
            )}

            {unavailableDates.isPending ? (
              <Spinner label={t('Verfügbarkeit wird geladen …')} />
            ) : unavailableDates.isError ? (
              <div role="alert">
                <p>
                  {t('Die Verfügbarkeit konnte nicht geladen werden. Bitte versuche es erneut.')}
                </p>
                <Button onClick={() => void unavailableDates.refetch()}>
                  {t('Verfügbarkeit erneut laden')}
                </Button>
              </div>
            ) : (
              <DateRangePicker
                key={item.id}
                pricePerDay={item.pricePerDay}
                unavailableRanges={unavailableRanges}
                isSubmitting={createBooking.isPending}
                onDatesChange={() => createBooking.reset()}
                errorMessage={
                  createBooking.error instanceof Error ? createBooking.error.message : null
                }
                onSubmit={async (dates) => {
                  await createBooking.mutateAsync({ itemId: item.id, ...dates });
                }}
              />
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
