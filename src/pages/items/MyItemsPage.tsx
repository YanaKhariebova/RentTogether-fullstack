import { useTranslation } from 'react-i18next';
import { translate as t } from '../../i18n/config';
import { Button, Spinner } from '@/shared/ui/atoms';
import { OwnerItemCard } from '../../shared/ui/organisms/OwnerItemCard/OwnerItemCard';
import type { OwnerItem } from '../../features/items/types/item';
import styles from './MyItemsPage.module.css';

interface MyItemsPageProps {
  items: OwnerItem[];
  status: 'loading' | 'ready' | 'error';
  error?: string | null;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete?: (id: string) => void;
  onUnpublish: (id: string) => void;
  onPublish?: (id: string) => void;
  busy?: boolean;
  favoritePendingIds?: readonly string[];
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void;
  onRetry: () => void;
}

export function MyItemsPage({
  items,
  status,
  error,
  onCreate,
  onEdit,
  onDelete,
  onUnpublish,
  onRetry,
  onPublish,
  busy = false,
  favoritePendingIds = [],
  onFavoriteToggle,
}: MyItemsPageProps) {
  useTranslation();
  const published = items.filter((item) => item.isPublished).length;
  return (
    <section aria-labelledby="my-items-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{t('DEIN VERLEIH')}</p>
          <h1 id="my-items-title">{t('Meine Anzeigen')}</h1>
          <p className={styles.intro}>
            {t('Behalte deine Sachen im Blick und mache Platz für neue Möglichkeiten.')}
          </p>
        </div>
        <Button type="button" className={styles.primary} onClick={onCreate}>
          {t('+ Neue Anzeige')}
        </Button>
      </header>
      {status === 'loading' && (
        <div className={styles.state}>
          <Spinner label={t('Deine Anzeigen werden geladen …')} />
        </div>
      )}
      {status === 'error' && (
        <div className={styles.state} role="alert">
          <h3>{t('Das hat leider nicht geklappt.')}</h3>
          <p>{error || t('Deine Anzeigen konnten nicht geladen werden.')}</p>
          <Button type="button" onClick={onRetry}>
            {t('Erneut versuchen')}
          </Button>
        </div>
      )}
      {status === 'ready' && (
        <>
          <p className={styles.summary}>
            {t('listingCount', { count: items.length })} · {published} {t('veröffentlicht ·')}{' '}
            {items.length - published} {t('nicht veröffentlicht')}
          </p>
          {items.length === 0 ? (
            <div className={styles.state}>
              <h3>{t('Hier ist Platz für deine erste Anzeige.')}</h3>
              <p>{t('Verleihe Dinge, die du gerade nicht brauchst.')}</p>
              <Button type="button" className={styles.primary} onClick={onCreate}>
                {t('Erste Anzeige erstellen')}
              </Button>
            </div>
          ) : (
            <div className={styles.grid}>
              {items.map((item) => (
                <OwnerItemCard
                  key={item.id}
                  item={item}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onUnpublish={onUnpublish}
                  onPublish={onPublish}
                  busy={busy}
                  favoriteBusy={favoritePendingIds.includes(item.id)}
                  onFavoriteToggle={onFavoriteToggle}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
