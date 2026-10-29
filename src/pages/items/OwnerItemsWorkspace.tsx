import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { MyItemsPage } from './MyItemsPage';
import { UnpublishItemDialog } from '@/shared/ui/organisms/UnpublishItemDialog/UnpublishItemDialog';
import { useOwnerItemsStore } from '@/features/items/hooks/useOwnerItemsStore';
export function OwnerItemsWorkspace() {
  const store = useOwnerItemsStore();
  const navigate = useNavigate();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const item = store.items.find((entry) => entry.id === confirmId) ?? null;
  return (
    <>
      <MyItemsPage
        items={store.items}
        status={store.status}
        onCreate={() => {
          store.setNotice('');
          void navigate({ to: '/account/items/new' });
        }}
        onEdit={(itemId) => {
          store.setNotice('');
          void navigate({ to: '/account/items/$itemId/edit', params: { itemId } });
        }}
        onUnpublish={setConfirmId}
        onRetry={store.retry}
      />
      <UnpublishItemDialog
        item={item}
        onCancel={() => setConfirmId(null)}
        onConfirm={async (id) => {
          try {
            await store.unpublish(id);
            setConfirmId(null);
            store.setNotice('Deine Anzeige wurde ausgeblendet.');
          } catch {
            store.setNotice('Die Anzeige konnte nicht ausgeblendet werden.');
          }
        }}
      />
    </>
  );
}
