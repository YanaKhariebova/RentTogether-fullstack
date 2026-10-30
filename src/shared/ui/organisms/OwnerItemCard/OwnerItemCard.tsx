import { Badge, Button } from '@/shared/ui/atoms';
import styles from './OwnerItemCard.module.css';

interface OwnerItemCardProps {
  item: {
    id: string;
    title: string;
    city: string;
    pricePerDay: string;
    isPublished: boolean;
    category: { name: string };
    images: { id: string; url: string; order: number }[];
  };
  onEdit: (id: string) => void;
  onDelete?: (id: string) => void;
  onUnpublish: (id: string) => void;
  onPublish?: (id: string) => void;
  busy?: boolean;
}

export function OwnerItemCard({
  item,
  onEdit,
  onDelete,
  onUnpublish,
  onPublish,
  busy = false,
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
