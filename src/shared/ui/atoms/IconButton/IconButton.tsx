import type { ButtonHTMLAttributes } from 'react';
import styles from './IconButton.module.css';
export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { label: string };
export function IconButton({ label, type = 'button', className = '', ...props }: IconButtonProps) {
  return (
    <button
      {...props}
      type={type}
      aria-label={label}
      title={label}
      className={`${styles.button} ${className}`}
    />
  );
}
