import { Button } from '@/shared/ui/atoms';
import { useEffect, useId, useRef } from 'react';
import styles from './UnpublishItemDialog.module.css';

interface UnpublishItemDialogProps {
  action?: 'unpublish' | 'delete';
  item: { id: string; title: string } | null;
  onCancel: () => void;
  onConfirm: (id: string) => void | Promise<void>;
  busy?: boolean;
  error?: string | null;
}

export function UnpublishItemDialog({
  action = 'unpublish',
  item,
  onCancel,
  onConfirm,
  busy = false,
  error,
}: UnpublishItemDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    if (item && !dialog.current?.open) dialog.current?.showModal();
    if (!item && dialog.current?.open) dialog.current.close();
  }, [item]);

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id={`${id}-title`}>
        {action === 'delete' ? 'Anzeige endgültig löschen?' : 'Anzeige ausblenden?'}
      </h2>
      <p id={`${id}-description`}>
        {action === 'delete'
          ? `„${item?.title}“ und die Fotos werden endgültig gelöscht. Das kann nicht rückgängig gemacht werden. Anzeigen mit Anfragen bleiben zum Schutz der Buchungshistorie erhalten.`
          : `„${item?.title}“ wird nicht mehr im Katalog angezeigt. Deine Anzeige bleibt in „Meine Anzeigen“ erhalten.`}
      </p>
      {error && <p role="alert">{error}</p>}
      <div className={styles.actions}>
        <Button type="button" disabled={busy} autoFocus onClick={onCancel}>
          Abbrechen
        </Button>
        <Button
          type="button"
          className={action === 'delete' ? styles.deleteConfirm : styles.confirm}
          loading={busy}
          onClick={() => {
            if (item) void onConfirm(item.id);
          }}
        >
          {action === 'delete' ? 'Endgültig löschen' : 'Ausblenden'}
        </Button>
      </div>
    </dialog>
  );
}
