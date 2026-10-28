import { Outlet } from '@tanstack/react-router';
import { useAuth } from '@clerk/react';
import { OwnerItemsProvider } from '@/features/items/components/OwnerItemsProvider';
import { useOwnerItemsStore } from '@/features/items/hooks/useOwnerItemsStore';
import styles from './OwnerItemsWorkspace.module.css';
export function OwnerItemsLayout() {
  const { userId } = useAuth();
  return (
    <OwnerItemsProvider key={userId}>
      <ItemsContent />
    </OwnerItemsProvider>
  );
}
function ItemsContent() {
  const { notice } = useOwnerItemsStore();
  return (
    <section className={styles.workspace} aria-label="Deine Anzeigen verwalten">
      <p className={styles.demo}>
        Demo · Änderungen gelten nur bis zum Neuladen oder Verlassen dieses Bereichs. Es werden
        keine Anzeigen online veröffentlicht.
      </p>
      <p className={styles.feedback} role="status">
        {notice}
      </p>
      <Outlet />
    </section>
  );
}
