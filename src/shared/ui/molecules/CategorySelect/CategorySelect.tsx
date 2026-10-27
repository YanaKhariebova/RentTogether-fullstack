import { useId } from "react";
import styles from "./CategorySelect.module.css";

interface CategorySelectProps {
  categories: { id: string; name: string }[];
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function CategorySelect({ categories, value, error, onChange }: CategorySelectProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id}>Kategorie *</label>
      <select id={id} name="categoryId" required value={value}
        aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.currentTarget.value)}>
        <option value="">Kategorie auswählen</option>
        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>
      {error && <span id={`${id}-error`} className={styles.error}>{error}</span>}
    </div>
  );
}
