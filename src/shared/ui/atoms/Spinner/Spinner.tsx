import { useTranslation } from 'react-i18next';
import { translate as t } from '../../../../i18n/config';
import styles from './Spinner.module.css';
export function Spinner({ label = t('Wird geladen …') }: { label?: string }) {
  useTranslation();
  return (
    <span role="status" className={styles.spinner}>
      {label}
    </span>
  );
}
