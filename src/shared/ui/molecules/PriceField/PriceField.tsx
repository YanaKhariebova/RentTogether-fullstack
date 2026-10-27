import { useId } from "react";
import styles from "./PriceField.module.css";

interface PriceFieldProps {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function PriceField({ value, error, onChange }: PriceFieldProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id}>Preis pro Tag (€) *</label>
      <input id={id} name="pricePerDay" type="text" inputMode="decimal" required
        value={value} placeholder="15,50" aria-invalid={Boolean(error)}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        onChange={(event) => onChange(event.currentTarget.value)} />
      <span id={`${id}-hint`} className={styles.hint}>Zum Beispiel 15,50 € pro Tag.</span>
      {error && <span id={`${id}-error`} className={styles.error}>{error}</span>}
    </div>
  );
}
