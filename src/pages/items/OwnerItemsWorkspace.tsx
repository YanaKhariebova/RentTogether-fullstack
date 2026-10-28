import { useEffect, useRef, useState } from "react";
import { MyItemsPage } from "./MyItemsPage";
import { NewItemPage } from "./NewItemPage";
import { EditItemPage } from "./EditItemPage";
import { UnpublishItemDialog } from "../../shared/ui/organisms/UnpublishItemDialog/UnpublishItemDialog";
import { useMockOwnerItems } from "../../features/items/hooks/useMockOwnerItems";
import styles from "./OwnerItemsWorkspace.module.css";

type WorkspaceView = { page: "list" } | { page: "new" } | { page: "edit"; id: string };

// Временная композиция страниц до подключения TanStack Router участником 1.
export function OwnerItemsWorkspace() {
  const store = useMockOwnerItems();
  const [view, setView] = useState<WorkspaceView>({ page: "list" });
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const region = useRef<HTMLElement>(null);
  const editedItem = view.page === "edit" ? store.items.find((item) => item.id === view.id) : undefined;
  const confirmItem = store.items.find((item) => item.id === confirmId) ?? null;

  useEffect(() => { region.current?.focus(); }, [view]);

  function backToList() { setView({ page: "list" }); }

  return (
    <section className={styles.workspace} ref={region} tabIndex={-1} aria-label="Deine Anzeigen verwalten">
      <p className={styles.demo}>Demo · Änderungen gelten nur bis zum Neuladen. Es werden keine Anzeigen online veröffentlicht.</p>
      <p className={styles.feedback} role="status">{message}</p>
      {view.page === "list" && <MyItemsPage items={store.items} status={store.status}
        onCreate={() => { setMessage(""); setView({ page: "new" }); }}
        onEdit={(id) => { setMessage(""); setView({ page: "edit", id }); }}
        onUnpublish={setConfirmId} onRetry={store.retry} />}
      {view.page === "new" && <NewItemPage onCancel={backToList} onSave={(values) => {
        store.saveItem(values); setMessage("Deine Anzeige wurde lokal gespeichert."); backToList();
      }} />}
      {view.page === "edit" && (editedItem ? <EditItemPage item={editedItem} onCancel={backToList} onSave={(values) => {
        store.saveItem(values, editedItem.id); setMessage("Deine Änderungen wurden lokal gespeichert."); backToList();
      }} /> : <div role="alert"><p>Die Anzeige wurde nicht gefunden.</p><button type="button" onClick={backToList}>Meine Anzeigen</button></div>)}
      <UnpublishItemDialog item={confirmItem} onCancel={() => setConfirmId(null)} onConfirm={(id) => {
        store.unpublish(id); setConfirmId(null); setMessage("Deine Anzeige wurde ausgeblendet.");
      }} />
    </section>
  );
}
