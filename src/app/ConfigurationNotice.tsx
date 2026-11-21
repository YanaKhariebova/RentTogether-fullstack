import { useTranslation } from 'react-i18next';
import { translate as t } from '../i18n/config';
import styles from './ConfigurationNotice.module.css';
export function ConfigurationNotice() {
  useTranslation();
  return (
    <main className={styles.notice}>
      <h1>RentTogether</h1>
      <p>{t('Die Anwendung wird eingerichtet. Bitte versuche es später erneut.')}</p>
    </main>
  );
}
