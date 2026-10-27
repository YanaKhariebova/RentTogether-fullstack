import { useEffect, useId, useRef } from "react";
import { CategorySelect } from "../../molecules/CategorySelect/CategorySelect";
import { PriceField } from "../../molecules/PriceField/PriceField";
import { ImageUploader } from "../../molecules/ImageUploader/ImageUploader";
import { ImageGalleryEditor } from "../ImageGalleryEditor/ImageGalleryEditor";
import styles from "./ItemForm.module.css";

interface FormFields {
  title: string;
  description: string;
  city: string;
  categoryId: string;
  pricePerDay: string;
}

interface ItemFormProps {
  values: FormFields;
  errors: Partial<Record<keyof FormFields | "images", string>>;
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
    <form className={styles.form} ref={formRef} noValidate onSubmit={(event) => {
      event.preventDefault();
      void props.onSubmit();
    }}>
      <p className={styles.hint}>Mit * markierte Felder sind Pflichtfelder.</p>
      {Object.values(errors).some(Boolean) && <p className={styles.error} role="alert">Bitte überprüfe die markierten Felder.</p>}
      <fieldset className={styles.fields} disabled={props.isSubmitting}>
        <legend className={styles.legend}>Angaben zur Anzeige</legend>
        <div className={styles.field}>
          <label htmlFor={`${id}-title`}>Titel *</label>
          <input id={`${id}-title`} name="title" required value={values.title} maxLength={100}
            placeholder="Zum Beispiel: Beamer für einen Filmabend" aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? `${id}-title-error` : undefined}
            onChange={(event) => props.onFieldChange("title", event.currentTarget.value)} />
          {errors.title && <span className={styles.error} id={`${id}-title-error`}>{errors.title}</span>}
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-description`}>Beschreibung *</label>
          <textarea id={`${id}-description`} name="description" required rows={5} maxLength={5000}
            value={values.description} placeholder="Beschreibe deine Sache und das Zubehör."
            aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? `${id}-description-error` : undefined}
            onChange={(event) => props.onFieldChange("description", event.currentTarget.value)} />
          {errors.description && <span className={styles.error} id={`${id}-description-error`}>{errors.description}</span>}
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor={`${id}-city`}>Ort *</label>
            <input id={`${id}-city`} name="city" required maxLength={100} autoComplete="address-level2"
              value={values.city} placeholder="Berlin" aria-invalid={Boolean(errors.city)}
              aria-describedby={errors.city ? `${id}-city-error` : undefined}
              onChange={(event) => props.onFieldChange("city", event.currentTarget.value)} />
            {errors.city && <span className={styles.error} id={`${id}-city-error`}>{errors.city}</span>}
          </div>
          <CategorySelect categories={props.categories} value={values.categoryId} error={errors.categoryId}
            onChange={(value) => props.onFieldChange("categoryId", value)} />
        </div>
        <PriceField value={values.pricePerDay} error={errors.pricePerDay}
          onChange={(value) => props.onFieldChange("pricePerDay", value)} />
        <section aria-labelledby={`${id}-photos`}>
          <h2 id={`${id}-photos`}>Fotos *</h2>
          <p>Das erste Foto ist dein Titelbild. Mit den Pfeilen änderst du die Reihenfolge.</p>
          <ImageUploader accept={props.imageAccept} disabled={props.images.length >= props.maxImages}
            error={errors.images} onFilesSelected={props.onFilesSelected} />
          <p role="status">{props.images.length} von {props.maxImages} Fotos</p>
          {props.imageErrors.length > 0 && <ul className={styles.error} role="alert">{props.imageErrors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}</ul>}
          <ImageGalleryEditor images={props.images} onRemove={props.onImageRemove} onMove={props.onImageMove} />
        </section>
        {props.submitError && <p className={styles.error} role="alert">{props.submitError}</p>}
        <button className={styles.submit} type="submit">{props.isSubmitting ? "Wird geprüft …" : props.submitLabel}</button>
      </fieldset>
    </form>
  );
}
