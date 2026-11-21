import { useTranslation } from 'react-i18next';
import { translate as t } from '@/i18n/config';
import { useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import styles from './Textarea.module.css';
export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};
export function Textarea({ label, error, id, className = '', ...props }: TextareaProps) {
  useTranslation();
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className={styles.field}>
      <label htmlFor={inputId}>{label}</label>
      <textarea
        {...props}
        id={inputId}
        className={`${styles.input} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && (
        <span id={`${inputId}-error`} className={styles.error}>
          {t(error)}
        </span>
      )}
    </div>
  );
}
