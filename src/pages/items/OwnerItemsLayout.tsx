import { useTranslation } from 'react-i18next';
import { translate as t } from '../../i18n/config';
import { Outlet } from '@tanstack/react-router';
import { useAuth } from '@clerk/react';
import { OwnerItemsProvider } from '@/features/items/components/OwnerItemsProvider';
import { useOwnerItemsStore } from '@/features/items/hooks/useOwnerItemsStore';
import styles from './OwnerItemsWorkspace.module.css';
export function OwnerItemsLayout() {
  useTranslation();
  const { userId } = useAuth();
  return (
    <OwnerItemsProvider key={userId}>
      <ItemsContent />
    </OwnerItemsProvider>
  );
}
function ItemsContent() {
  useTranslation();
  const { notice } = useOwnerItemsStore();
  return (
    <section className={styles.workspace} aria-label={t('Deine Anzeigen verwalten')}>
      <p className={styles.feedback} role="status">
        {t(notice ?? '')}
      </p>
      <Outlet />
    </section>
  );
}
