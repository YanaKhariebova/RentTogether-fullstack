import { useTranslation } from 'react-i18next';
import { translate as t } from '@/i18n/config';
import { useId } from 'react';
import type { SelectHTMLAttributes } from 'react';
import styles from './Select.module.css';
export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  options: readonly { value: string; label: string }[];
};
export function Select({ label, error, options, id, className = '', ...props }: SelectProps) {
  useTranslation();
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className={styles.field}>
      <label htmlFor={inputId}>{label}</label>
      <select
        {...props}
        id={inputId}
        className={`${styles.select} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span id={`${inputId}-error`} className={styles.error}>
          {t(error)}
        </span>
      )}
    </div>
  );
}
