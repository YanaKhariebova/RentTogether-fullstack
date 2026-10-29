import { Button } from '@/shared/ui/atoms';
import { OwnerItemCard } from '../../shared/ui/organisms/OwnerItemCard/OwnerItemCard';
import type { OwnerItem } from '../../features/items/types/item';
import styles from './MyItemsPage.module.css';

interface MyItemsPageProps {
  items: OwnerItem[];
  status: 'loading' | 'ready' | 'error';
  onCreate: () => void;
  onEdit: (id: string) => void;
  onUnpublish: (id: string) => void;
  onPublish?: (id: string) => void;
  busy?: boolean;
  onRetry: () => void;
}

export function MyItemsPage({
  items,
  status,
  onCreate,
  onEdit,
  onUnpublish,
  onRetry,
  onPublish,
  busy = false,
}: MyItemsPageProps) {
  const published = items.filter((item) => item.isPublished).length;
  return (
    <section aria-labelledby="my-items-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>DEIN VERLEIH</p>
          <h1 id="my-items-title">Meine Anzeigen</h1>
          <p className={styles.intro}>
            Behalte deine Sachen im Blick und mache Platz für neue Möglichkeiten.
          </p>
        </div>
        <Button type="button" className={styles.primary} onClick={onCreate}>
          + Neue Anzeige
        </Button>
      </header>
      {status === 'loading' && (
        <p className={styles.state} role="status">
          Deine Anzeigen werden geladen …
        </p>
      )}
      {status === 'error' && (
        <div className={styles.state} role="alert">
          <h3>Das hat leider nicht geklappt.</h3>
          <p>Deine Anzeigen konnten nicht geladen werden.</p>
          <Button type="button" onClick={onRetry}>
            Erneut versuchen
          </Button>
        </div>
      )}
      {status === 'ready' && (
        <>
          <p className={styles.summary}>
            {items.length} {items.length === 1 ? 'Anzeige' : 'Anzeigen'} · {published}{' '}
            veröffentlicht · {items.length - published} nicht veröffentlicht
          </p>
          {items.length === 0 ? (
            <div className={styles.state}>
              <h3>Hier ist Platz für deine erste Anzeige.</h3>
              <p>Verleihe Dinge, die du gerade nicht brauchst.</p>
              <Button type="button" className={styles.primary} onClick={onCreate}>
                Erste Anzeige erstellen
              </Button>
            </div>
          ) : (
            <div className={styles.grid}>
              {items.map((item) => (
                <OwnerItemCard
                  key={item.id}
                  item={item}
                  onEdit={onEdit}
                  onUnpublish={onUnpublish}
                  onPublish={onPublish}
                  busy={busy}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
