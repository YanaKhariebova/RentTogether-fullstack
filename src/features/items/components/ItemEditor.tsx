import { useTranslation } from 'react-i18next';
import { translate as t } from '../../../i18n/config';
import { Button } from '@/shared/ui/atoms';
import { useRef, useState } from 'react';
import { useItemForm } from '../hooks/useItemForm';
import { initialItemFormValues } from '../model/itemFormSchema';
import { itemErrorMessage, itemFieldErrors } from '../model/itemErrorMessage';
import { toCreateItemInput, toItemFormValues } from '../model/itemFormAdapters';
import { ACCEPTED_IMAGE_TYPES, MAX_ITEM_IMAGES } from '../model/itemFormSchema';
import type { ValidatedItemForm } from '../model/itemFormSchema';
import type { ItemCategory, OwnerItem } from '../types/item';
import { ItemForm } from '../../../shared/ui/organisms/ItemForm/ItemForm';
import styles from './ItemEditor.module.css';
import { CitySearch } from '@/features/locations/CitySearch';

interface ItemEditorProps {
  item?: OwnerItem;
  categories: ItemCategory[];
  defaultCity?: string;
  onSave: (values: ValidatedItemForm) => void | Promise<void>;
  onCancel: () => void;
}

export function ItemEditor({
  item,
  categories,
  defaultCity = '',
  onSave,
  onCancel,
}: ItemEditorProps) {
  useTranslation();
  const saving = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<ValidatedItemForm | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const form = useItemForm(
    (values) => {
      setPreview(values);
      setSaveError(null);
    },
    item ? toItemFormValues(item) : { ...initialItemFormValues, city: defaultCity },
  );
  const payload = preview ? toCreateItemInput(preview) : null;

  function invalidatePreview() {
    setPreview(null);
    setSaveError(null);
  }

  return (
    <section className={styles.page} aria-labelledby="item-editor-title">
      <header>
        <Button className={styles.back} type="button" disabled={isSaving} onClick={onCancel}>
          {t('← Meine Anzeigen')}
        </Button>
        <h1 id="item-editor-title" className={styles.title}>
          {item ? t('Anzeige bearbeiten') : t('Neue Anzeige')}
        </h1>
        <p>
          {item
            ? t('Passe die Angaben und Fotos deiner Anzeige an.')
            : t('Was möchtest du verleihen?')}
        </p>
        <p className={styles.notice}>
          {t(
            'Prüfe deine Vorschau und speichere danach deine Anzeige. Neue Anzeigen werden als Entwurf gespeichert.',
          )}
        </p>
      </header>
      <ItemForm
        values={form.values}
        cityField={
          <CitySearch
            value={form.values.city}
            error={form.errors.city}
            disabled={form.isSubmitting || isSaving}
            onChange={(city) => {
              invalidatePreview();
              form.changeField('city', city);
            }}
          />
        }
        errors={form.errors}
        categories={categories}
        images={form.images}
        imageErrors={form.imageErrors}
        imageAccept={ACCEPTED_IMAGE_TYPES.join(',')}
        maxImages={MAX_ITEM_IMAGES}
        submitAttempts={form.submitAttempts}
        isSubmitting={form.isSubmitting || isSaving}
        submitError={form.submitError ?? (preview ? null : saveError)}
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
          <p role="status">{t('Hier ist deine Vorschau. Prüfe die Angaben vor dem Speichern.')}</p>
          {form.images[0] && (
            <img className={styles.cover} src={form.images[0].url} alt={payload.title} />
          )}
          <h2 id="preview-title">{payload.title}</h2>
          <p className={styles.description}>{payload.description}</p>
          <dl className={styles.details}>
            <dt>{t('Ort')}</dt>
            <dd>{payload.city}</dd>
            <dt>{t('Kategorie')}</dt>
            <dd>
              {t(categories.find((category) => category.id === payload.categoryId)?.name ?? '')}
            </dd>
            <dt>{t('Preis pro Tag')}</dt>
            <dd>{payload.pricePerDay.replace('.', ',')} €</dd>
            <dt>{t('Fotos')}</dt>
            <dd>{preview.images.length}</dd>
          </dl>
          {saveError && <p role="alert">{saveError}</p>}
          <Button
            className={styles.save}
            type="button"
            loading={isSaving}
            onClick={async () => {
              if (saving.current) return;
              saving.current = true;
              setIsSaving(true);
              setSaveError(null);
              try {
                await onSave(preview);
              } catch (error) {
                setSaveError(itemErrorMessage(error));
                const fieldErrors = itemFieldErrors(error);
                if (Object.keys(fieldErrors).length > 0) {
                  form.setServerErrors(fieldErrors);
                  setPreview(null);
                }
              } finally {
                saving.current = false;
                setIsSaving(false);
              }
            }}
          >
            {item ? t('Änderungen speichern') : t('Anzeige speichern')}
          </Button>
        </section>
      )}
    </section>
  );
}
