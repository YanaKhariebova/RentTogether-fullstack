import { Input } from '@/shared/ui/atoms';
import styles from './PriceField.module.css';
interface PriceFieldProps {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}
export function PriceField({ value, error, onChange }: PriceFieldProps) {
  return (
    <div className={styles.field}>
      <Input
        label="Preis pro Tag (€) *"
        name="pricePerDay"
        type="text"
        inputMode="decimal"
        required
        value={value}
        placeholder="15,50"
        error={error}
        hint="Zum Beispiel 15,50 € pro Tag."
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  );
}
