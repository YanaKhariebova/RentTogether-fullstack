import { useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import styles from './Textarea.module.css';
export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};
export function Textarea({ label, error, id, className = '', ...props }: TextareaProps) {
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
          {error}
        </span>
      )}
    </div>
  );
}
