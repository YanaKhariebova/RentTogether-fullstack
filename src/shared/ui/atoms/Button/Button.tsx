import { useTranslation } from 'react-i18next';
import { translate as t } from '../../../../i18n/config';
import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
};
export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  useTranslation();
  return (
    <button
      {...props}
      type={type}
      className={`${styles.button} ${styles[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? t('Bitte warten …') : children}
    </button>
  );
}
