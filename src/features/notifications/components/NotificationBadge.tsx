import styles from './NotificationBadge.module.css';
export function NotificationBadge({ count }: { count?: number }) {
  if (!count || count < 0 || !Number.isFinite(count)) return null;
  return (
    <span className={styles.badge} aria-hidden="true">
      {count > 99 ? '99+' : count}
    </span>
  );
}
