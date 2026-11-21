import { useTranslation } from 'react-i18next';
import { translate as t, translateFeedback } from '../../../../i18n/config';
import { Button, Input, Textarea } from '@/shared/ui/atoms';
import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { CategorySelect } from '../../molecules/CategorySelect/CategorySelect';
import { PriceField } from '../../molecules/PriceField/PriceField';
import { ImageUploader } from '../../molecules/ImageUploader/ImageUploader';
import { ImageGalleryEditor } from '../ImageGalleryEditor/ImageGalleryEditor';
import styles from './ItemForm.module.css';

interface FormFields {
  title: string;
  description: string;
  city: string;
  categoryId: string;
  pricePerDay: string;
}

interface ItemFormProps {
  cityField?: ReactNode;
  values: FormFields;
  errors: Partial<Record<keyof FormFields | 'images', string>>;
  categories: { id: string; name: string }[];
  images: { id: string; url: string; name: string }[];
  imageErrors: string[];
  imageAccept: string;
  maxImages: number;
  submitAttempts: number;
  isSubmitting: boolean;
  submitError: string | null;
  submitLabel: string;
  onFieldChange: (field: keyof FormFields, value: string) => void;
  onFilesSelected: (files: File[]) => void;
  onImageRemove: (id: string) => void;
  onImageMove: (id: string, direction: -1 | 1) => void;
  onSubmit: () => void | Promise<void>;
}

// Только представление: запросы и состояние остаются в features/items.
export function ItemForm(props: ItemFormProps) {
  useTranslation();
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const lastAttempt = useRef(0);
  const { values, errors } = props;

  useEffect(() => {
    if (lastAttempt.current === props.submitAttempts) return;
    lastAttempt.current = props.submitAttempts;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [props.submitAttempts, errors]);

  return (
    <form
      className={styles.form}
      ref={formRef}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void props.onSubmit();
      }}
    >
      <p className={styles.hint}>{t('Mit * markierte Felder sind Pflichtfelder.')}</p>
      {Object.values(errors).some(Boolean) && (
        <p className={styles.error} role="alert">
          {t('Bitte überprüfe die markierten Felder.')}
        </p>
      )}
      <fieldset className={styles.fields} disabled={props.isSubmitting}>
        <legend className={styles.legend}>{t('Angaben zur Anzeige')}</legend>
        <Input
          label={t('Titel *')}
          name="title"
          required
          value={values.title}
          maxLength={100}
          placeholder={t('Zum Beispiel: Beamer für einen Filmabend')}
          error={errors.title}
          onChange={(event) => props.onFieldChange('title', event.currentTarget.value)}
        />
        <Textarea
          label={t('Beschreibung *')}
          name="description"
          required
          rows={5}
          maxLength={5000}
          value={values.description}
          placeholder={t('Beschreibe deine Sache und das Zubehör.')}
          error={errors.description}
          onChange={(event) => props.onFieldChange('description', event.currentTarget.value)}
        />
        <div className={styles.row}>
          {props.cityField ?? (
            <Input
              label={t('Ort *')}
              name="city"
              required
              maxLength={100}
              autoComplete="address-level2"
              value={values.city}
              placeholder="Berlin"
              error={errors.city}
              onChange={(event) => props.onFieldChange('city', event.currentTarget.value)}
            />
          )}
          <CategorySelect
            categories={props.categories}
            value={values.categoryId}
            error={errors.categoryId}
            onChange={(value) => props.onFieldChange('categoryId', value)}
          />
        </div>
        <PriceField
          value={values.pricePerDay}
          error={errors.pricePerDay}
          onChange={(value) => props.onFieldChange('pricePerDay', value)}
        />
        <section aria-labelledby={`${id}-photos`}>
          <h2 id={`${id}-photos`}>{t('Fotos *')}</h2>
          <p>
            {t('Das erste Foto ist dein Titelbild. Mit den Pfeilen änderst du die Reihenfolge.')}
          </p>
          <ImageUploader
            accept={props.imageAccept}
            disabled={props.images.length >= props.maxImages}
            error={
              props.imageErrors.length > 0
                ? t(
                    'Einige Dateien konnten nicht hinzugefügt werden. Bitte prüfe die Hinweise unten.',
                  )
                : errors.images
            }
            onFilesSelected={props.onFilesSelected}
          />
          <p role="status">
            {t('photoCount', { count: props.images.length, limit: props.maxImages })}
          </p>
          {props.imageErrors.length > 0 && (
            <ul className={styles.error} role="alert">
              {props.imageErrors.map((error, index) => (
                <li key={`${index}-${error}`}>{translateFeedback(error)}</li>
              ))}
            </ul>
          )}
          <ImageGalleryEditor
            images={props.images}
            onRemove={props.onImageRemove}
            onMove={props.onImageMove}
          />
        </section>
        {props.submitError && (
          <p className={styles.error} role="alert">
            {props.submitError}
          </p>
        )}
        <Button className={styles.submit} type="submit" loading={props.isSubmitting}>
          {props.submitLabel}
        </Button>
      </fieldset>
    </form>
  );
}
