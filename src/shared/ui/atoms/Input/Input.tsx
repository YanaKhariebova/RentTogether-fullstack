import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import styles from './Input.module.css';
export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};
export function Input({ label, error, hint, id, className = '', ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className={styles.field}>
      <label htmlFor={inputId}>{label}</label>
      <input
        {...props}
        id={inputId}
        className={`${styles.input} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${inputId}-help` : undefined}
      />
      {(error || hint) && (
        <span id={`${inputId}-help`} className={error ? styles.error : styles.hint}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
