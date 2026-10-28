import { OwnerItemCard } from "../../shared/ui/organisms/OwnerItemCard/OwnerItemCard";
import type { OwnerItem } from "../../features/items/types/item";
import styles from "./MyItemsPage.module.css";

interface MyItemsPageProps {
  items: OwnerItem[];
  status: "loading" | "ready" | "error";
  onCreate: () => void;
  onEdit: (id: string) => void;
  onUnpublish: (id: string) => void;
  onRetry: () => void;
}

export function MyItemsPage({ items, status, onCreate, onEdit, onUnpublish, onRetry }: MyItemsPageProps) {
  const published = items.filter((item) => item.isPublished).length;
  return (
    <section aria-labelledby="my-items-title">
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>DEIN VERLEIH</p><h2 id="my-items-title">Meine Anzeigen</h2>
          <p className={styles.intro}>Behalte deine Sachen im Blick und mache Platz für neue Möglichkeiten.</p></div>
        <button type="button" className={styles.primary} onClick={onCreate}>+ Neue Anzeige</button>
      </header>
      {status === "loading" && <p className={styles.state} role="status">Deine Anzeigen werden geladen …</p>}
      {status === "error" && <div className={styles.state} role="alert"><h3>Das hat leider nicht geklappt.</h3>
        <p>Deine Anzeigen konnten nicht geladen werden.</p><button type="button" onClick={onRetry}>Erneut versuchen</button></div>}
      {status === "ready" && <>
        <p className={styles.summary}>{items.length} {items.length === 1 ? "Anzeige" : "Anzeigen"} · {published} veröffentlicht · {items.length - published} nicht veröffentlicht</p>
        {items.length === 0 ? <div className={styles.state}><h3>Hier ist Platz für deine erste Anzeige.</h3>
          <p>Verleihe Dinge, die du gerade nicht brauchst.</p>
          <button type="button" className={styles.primary} onClick={onCreate}>Erste Anzeige erstellen</button></div>
          : <div className={styles.grid}>{items.map((item) => <OwnerItemCard key={item.id} item={item} onEdit={onEdit} onUnpublish={onUnpublish} />)}</div>}
      </>}
    </section>
  );
}
