import styles from './Spinner.module.css';
export function Spinner({ label = 'Wird geladen …' }: { label?: string }) {
  return (
    <span role="status" className={styles.spinner}>
      {label}
    </span>
  );
}
