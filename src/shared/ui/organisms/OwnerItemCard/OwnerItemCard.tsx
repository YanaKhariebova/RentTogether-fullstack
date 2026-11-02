import { Badge, Button, IconButton } from '@/shared/ui/atoms';
import styles from './OwnerItemCard.module.css';

interface OwnerItemCardProps {
  item: {
    id: string;
    title: string;
    city: string;
    pricePerDay: string;
    isPublished: boolean;
    isFavorite?: boolean;
    category: { name: string };
    images: { id: string; url: string; order: number }[];
  };
  onEdit: (id: string) => void;
  onDelete?: (id: string) => void;
  onUnpublish: (id: string) => void;
  onPublish?: (id: string) => void;
  busy?: boolean;
  favoriteBusy?: boolean;
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void;
}

export function OwnerItemCard({
  item,
  onEdit,
  onDelete,
  onUnpublish,
  onPublish,
  busy = false,
  favoriteBusy = false,
  onFavoriteToggle,
}: OwnerItemCardProps) {
  const cover = [...item.images].sort((a, b) => a.order - b.order)[0];
  return (
    <article className={styles.card}>
      <div className={styles.cover}>
        {cover ? (
          <img src={cover.url} alt={item.title} loading="lazy" />
        ) : (
          <span>Noch kein Foto</span>
        )}
        <Badge className={styles.status} variant={item.isPublished ? 'success' : 'neutral'}>
          {item.isPublished ? 'Veröffentlicht' : 'Nicht veröffentlicht'}
        </Badge>
        <IconButton
          className={styles.favorite}
          label={
            !onFavoriteToggle
              ? `${item.title}: Favoriten sind bald verfügbar.`
              : !item.isPublished && !item.isFavorite
                ? `${item.title}: Zum Favorisieren zuerst veröffentlichen.`
                : item.isFavorite
                  ? `${item.title} aus Favoriten entfernen`
                  : `${item.title} zu Favoriten hinzufügen`
          }
          aria-pressed={onFavoriteToggle ? Boolean(item.isFavorite) : undefined}
          aria-busy={favoriteBusy || undefined}
          disabled={
            busy || favoriteBusy || !onFavoriteToggle || (!item.isPublished && !item.isFavorite)
          }
          onClick={() => onFavoriteToggle?.(item.id, !item.isFavorite)}
        >
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            aria-hidden="true"
            focusable="false"
            fill={item.isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
          </svg>
        </IconButton>
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{item.title}</h3>
        <p className={styles.city}>{item.city}</p>
        <div className={styles.meta}>
          <span className={styles.category}>{item.category.name}</span>
          <strong>{item.pricePerDay.replace('.', ',')} € / Tag</strong>
        </div>
        <div className={styles.actions}>
          <Button
            type="button"
            disabled={busy}
            onClick={() => onEdit(item.id)}
            aria-label={`${item.title} bearbeiten`}
          >
            Bearbeiten
          </Button>
          {!item.isPublished && onPublish && (
            <Button
              type="button"
              disabled={busy || item.images.length === 0}
              onClick={() => onPublish(item.id)}
              aria-label={`${item.title} veröffentlichen`}
            >
              Veröffentlichen
            </Button>
          )}
          {item.isPublished && (
            <Button
              type="button"
              disabled={busy}
              onClick={() => onUnpublish(item.id)}
              aria-label={`${item.title} ausblenden`}
            >
              Ausblenden
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              variant="danger"
              className={styles.deleteButton}
              disabled={busy}
              onClick={() => onDelete(item.id)}
              aria-label={`${item.title} löschen`}
            >
              Löschen
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
