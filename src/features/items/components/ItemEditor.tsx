import { Button } from '@/shared/ui/atoms';
import { useState } from 'react';
import { useItemForm } from '../hooks/useItemForm';
import { mockCategories } from '../mocks/items';
import { toCreateItemInput, toItemFormValues } from '../model/itemFormAdapters';
import { ACCEPTED_IMAGE_TYPES, MAX_ITEM_IMAGES } from '../model/itemFormSchema';
import type { ValidatedItemForm } from '../model/itemFormSchema';
import type { OwnerItem } from '../types/item';
import { ItemForm } from '../../../shared/ui/organisms/ItemForm/ItemForm';
import styles from './ItemEditor.module.css';

interface ItemEditorProps {
  item?: OwnerItem;
  onSave: (values: ValidatedItemForm) => void;
  onCancel: () => void;
}

export function ItemEditor({ item, onSave, onCancel }: ItemEditorProps) {
  const [preview, setPreview] = useState<ValidatedItemForm | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const form = useItemForm(
    (values) => {
      setPreview(values);
      setSaveError(null);
    },
    item ? toItemFormValues(item) : undefined,
  );
  const payload = preview ? toCreateItemInput(preview) : null;

  function invalidatePreview() {
    setPreview(null);
    setSaveError(null);
  }

  return (
    <section className={styles.page} aria-labelledby="item-editor-title">
      <header>
        <Button className={styles.back} type="button" onClick={onCancel}>
          ← Meine Anzeigen
        </Button>
        <h1 id="item-editor-title" className={styles.title}>
          {item ? 'Anzeige bearbeiten' : 'Neue Anzeige'}
        </h1>
        <p>
          {item ? 'Passe die Angaben und Fotos deiner Anzeige an.' : 'Was möchtest du verleihen?'}
        </p>
        <p className={styles.notice}>
          Die Vorschau prüft deine Angaben. Danach kannst du sie für diese Demo lokal speichern.
        </p>
      </header>
      <ItemForm
        values={form.values}
        errors={form.errors}
        categories={mockCategories}
        images={form.images}
        imageErrors={form.imageErrors}
        imageAccept={ACCEPTED_IMAGE_TYPES.join(',')}
        maxImages={MAX_ITEM_IMAGES}
        submitAttempts={form.submitAttempts}
        isSubmitting={form.isSubmitting}
        submitError={form.submitError}
        submitLabel="Vorschau anzeigen"
        onFieldChange={(field, value) => {
          invalidatePreview();
          form.changeField(field, value);
        }}
        onFilesSelected={(files) => {
          invalidatePreview();
          form.addFiles(files);
        }}
        onImageRemove={(id) => {
          invalidatePreview();
          form.removeImage(id);
        }}
        onImageMove={(id, direction) => {
          invalidatePreview();
          form.reorderImage(id, direction);
        }}
        onSubmit={form.submit}
      />
      {preview && payload && (
        <section className={styles.preview} aria-labelledby="preview-title">
          <p role="status">Alle Angaben sind gültig. Hier ist deine Vorschau.</p>
          {form.images[0] && (
            <img className={styles.cover} src={form.images[0].url} alt={payload.title} />
          )}
          <h2 id="preview-title">{payload.title}</h2>
          <p className={styles.description}>{payload.description}</p>
          <dl className={styles.details}>
            <dt>Ort</dt>
            <dd>{payload.city}</dd>
            <dt>Kategorie</dt>
            <dd>{mockCategories.find((category) => category.id === payload.categoryId)?.name}</dd>
            <dt>Preis pro Tag</dt>
            <dd>{payload.pricePerDay.replace('.', ',')} €</dd>
            <dt>Fotos</dt>
            <dd>{preview.images.length}</dd>
          </dl>
          {saveError && <p role="alert">{saveError}</p>}
          <Button
            className={styles.save}
            type="button"
            onClick={() => {
              try {
                onSave(preview);
              } catch {
                setSaveError('Speichern fehlgeschlagen. Bitte versuche es erneut.');
              }
            }}
          >
            {item ? 'Änderungen lokal speichern' : 'Anzeige lokal speichern'}
          </Button>
        </section>
      )}
    </section>
  );
}
