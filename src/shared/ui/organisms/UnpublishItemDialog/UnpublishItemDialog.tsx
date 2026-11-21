import { useTranslation } from 'react-i18next';
import { translate as t } from '../../../../i18n/config';
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
  useTranslation();
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
        {action === 'delete' ? t('Anzeige endgültig löschen?') : t('Anzeige ausblenden?')}
      </h2>
      <p id={`${id}-description`}>
        {action === 'delete'
          ? t(
              '„{{value0}}“ und die Fotos werden endgültig gelöscht. Das kann nicht rückgängig gemacht werden. Anzeigen mit Anfragen bleiben zum Schutz der Buchungshistorie erhalten.',
              { value0: item?.title },
            )
          : t(
              '„{{value0}}“ wird nicht mehr im Katalog angezeigt. Deine Anzeige bleibt in „Meine Anzeigen“ erhalten.',
              { value0: item?.title },
            )}
      </p>
      {error && <p role="alert">{error}</p>}
      <div className={styles.actions}>
        <Button type="button" disabled={busy} autoFocus onClick={onCancel}>
          {t('Abbrechen')}
        </Button>
        <Button
          type="button"
          className={action === 'delete' ? styles.deleteConfirm : styles.confirm}
          loading={busy}
          onClick={() => {
            if (item) void onConfirm(item.id);
          }}
        >
          {action === 'delete' ? t('Endgültig löschen') : t('Ausblenden')}
        </Button>
      </div>
    </dialog>
  );
}
