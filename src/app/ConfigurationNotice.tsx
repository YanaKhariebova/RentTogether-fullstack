import styles from './ConfigurationNotice.module.css';
export function ConfigurationNotice() {
  return (
    <main className={styles.notice}>
      <h1>RentTogether</h1>
      <p>Die Anwendung wird eingerichtet. Bitte versuche es später erneut.</p>
    </main>
  );
}
