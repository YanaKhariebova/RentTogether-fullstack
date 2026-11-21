import { useTranslation } from 'react-i18next';
import { translate as t } from '../../../../i18n/config';
import { Select } from '@/shared/ui/atoms';
import styles from './CategorySelect.module.css';
interface CategorySelectProps {
  categories: { id: string; name: string }[];
  value: string;
  error?: string;
  onChange: (value: string) => void;
}
export function CategorySelect({ categories, value, error, onChange }: CategorySelectProps) {
  useTranslation();
  return (
    <div className={styles.field}>
      <Select
        label={t('Kategorie *')}
        name="categoryId"
        required
        value={value}
        error={error}
        onChange={(event) => onChange(event.currentTarget.value)}
        options={[
          { value: '', label: t('Kategorie auswählen') },
          ...categories.map(({ id, name }) => ({ value: id, label: t(name) })),
        ]}
      />
    </div>
  );
}
