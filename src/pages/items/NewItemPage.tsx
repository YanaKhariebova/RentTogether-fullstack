import { useState } from "react";
import { useItemForm } from "../../features/items/hooks/useItemForm";
import { mockCategories } from "../../features/items/mocks/items";
import { toCreateItemInput } from "../../features/items/model/itemFormAdapters";
import { ACCEPTED_IMAGE_TYPES, MAX_ITEM_IMAGES } from "../../features/items/model/itemFormSchema";
import { ItemForm } from "../../shared/ui/organisms/ItemForm/ItemForm";
import styles from "./NewItemPage.module.css";

interface ItemPreview {
  title: string;
  description: string;
  city: string;
  category: string;
  pricePerDay: string;
  imageCount: number;
}

export function NewItemPage() {
  const [preview, setPreview] = useState<ItemPreview | null>(null);
  const form = useItemForm((values) => {
    const payload = toCreateItemInput(values);
    setPreview({
      ...payload,
      category: mockCategories.find((category) => category.id === payload.categoryId)?.name ?? "",
      imageCount: values.images.length,
    });
  });

  return (
    <section className={styles.page} aria-labelledby="new-item-title">
      <header>
        <h2 id="new-item-title" className={styles.title}>Neue Anzeige</h2>
        <p>Was möchtest du verleihen?</p>
        <p className={styles.notice}>Testversion: Du kannst deine Anzeige prüfen. Sie wird noch nicht gespeichert oder veröffentlicht. Nach dem Neuladen gehen deine Eingaben verloren.</p>
      </header>
      <ItemForm values={form.values} errors={form.errors} categories={mockCategories}
        images={form.images} imageErrors={form.imageErrors} imageAccept={ACCEPTED_IMAGE_TYPES.join(",")}
        maxImages={MAX_ITEM_IMAGES} submitAttempts={form.submitAttempts} isSubmitting={form.isSubmitting}
        submitError={form.submitError} submitLabel="Anzeige prüfen"
        onFieldChange={(field, value) => { setPreview(null); form.changeField(field, value); }}
        onFilesSelected={(files) => { setPreview(null); form.addFiles(files); }}
        onImageRemove={(id) => { setPreview(null); form.removeImage(id); }}
        onImageMove={(id, direction) => { setPreview(null); form.reorderImage(id, direction); }}
        onSubmit={form.submit} />
      {preview && <section className={styles.preview} aria-labelledby="preview-title">
        <p role="status">Alle Angaben sind gültig. Hier ist deine Vorschau.</p>
        <h2 id="preview-title">{preview.title}</h2>
        <p className={styles.description}>{preview.description}</p>
        <dl className={styles.details}>
          <dt>Ort</dt><dd>{preview.city}</dd>
          <dt>Kategorie</dt><dd>{preview.category}</dd>
          <dt>Preis pro Tag</dt><dd>{preview.pricePerDay.replace(".", ",")} €</dd>
          <dt>Fotos</dt><dd>{preview.imageCount}</dd>
        </dl>
      </section>}
    </section>
  );
}
