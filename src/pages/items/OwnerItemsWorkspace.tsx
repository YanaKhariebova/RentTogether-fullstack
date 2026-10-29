import { itemErrorMessage } from '@/features/items/model/itemErrorMessage';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { MyItemsPage } from './MyItemsPage';
import { UnpublishItemDialog } from '@/shared/ui/organisms/UnpublishItemDialog/UnpublishItemDialog';
import { useOwnerItemsStore } from '@/features/items/hooks/useOwnerItemsStore';
export function OwnerItemsWorkspace() {
  const store = useOwnerItemsStore();
  const navigate = useNavigate();
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const item = store.items.find((entry) => entry.id === confirmId) ?? null;
  return (
    <>
      {actionError && <p role="alert">{actionError}</p>}
      <MyItemsPage
        items={store.items}
        status={store.status}
        error={store.loadError}
        onCreate={() => {
          store.setNotice('');
          void navigate({ to: '/account/items/new' });
        }}
        onEdit={(itemId) => {
          store.setNotice('');
          void navigate({ to: '/account/items/$itemId/edit', params: { itemId } });
        }}
        busy={store.busy}
        onPublish={
          store.publish
            ? (id) => {
                setActionError(null);
                store.setNotice('');
                void Promise.resolve()
                  .then(() => store.publish!(id))
                  .then(() => store.setNotice('Deine Anzeige wurde veröffentlicht.'))
                  .catch((error) => setActionError(itemErrorMessage(error)));
              }
            : undefined
        }
        onUnpublish={(id) => {
          setConfirmError(null);
          setConfirmId(id);
        }}
        onRetry={store.retry}
      />
      <UnpublishItemDialog
        item={item}
        busy={store.busy}
        error={confirmError}
        onCancel={() => setConfirmId(null)}
        onConfirm={async (id) => {
          setConfirmError(null);
          store.setNotice('');
          try {
            await store.unpublish(id);
            setConfirmId(null);
            store.setNotice('Deine Anzeige wurde ausgeblendet.');
          } catch (error) {
            setConfirmError(itemErrorMessage(error));
          }
        }}
      />
    </>
  );
}
