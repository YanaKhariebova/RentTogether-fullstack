import type { HTMLAttributes } from 'react';
import styles from './Badge.module.css';
export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: 'neutral' | 'success' | 'warning';
};
export function Badge({ variant = 'neutral', className = '', ...props }: BadgeProps) {
  return <span {...props} className={`${styles.badge} ${styles[variant]} ${className}`} />;
}
