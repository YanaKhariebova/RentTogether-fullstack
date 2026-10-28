import { useEffect, useId, useRef } from "react";
import styles from "./UnpublishItemDialog.module.css";

interface UnpublishItemDialogProps {
  item: { id: string; title: string } | null;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}

export function UnpublishItemDialog({ item, onCancel, onConfirm }: UnpublishItemDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    if (item && !dialog.current?.open) dialog.current?.showModal();
    if (!item && dialog.current?.open) dialog.current.close();
  }, [item]);

  return (
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
      onCancel={(event) => { event.preventDefault(); onCancel(); }}>
      <h2 id={`${id}-title`}>Anzeige ausblenden?</h2>
      <p id={`${id}-description`}>„{item?.title}“ wird nicht mehr im Katalog angezeigt. Deine Anzeige bleibt in „Meine Anzeigen“ erhalten.</p>
      <div className={styles.actions}>
        <button type="button" autoFocus onClick={onCancel}>Abbrechen</button>
        <button type="button" className={styles.confirm} onClick={() => { if (item) onConfirm(item.id); }}>Ausblenden</button>
      </div>
    </dialog>
  );
}
