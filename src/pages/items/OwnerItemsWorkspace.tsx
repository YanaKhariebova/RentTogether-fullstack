import { useTranslation } from 'react-i18next';
import { translate as t } from '../../i18n/config';
import { itemErrorMessage } from '@/features/items/model/itemErrorMessage';
import { useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { MyItemsPage } from './MyItemsPage';
import { UnpublishItemDialog } from '@/shared/ui/organisms/UnpublishItemDialog/UnpublishItemDialog';
import { useOwnerItemsStore } from '@/features/items/hooks/useOwnerItemsStore';
export function OwnerItemsWorkspace() {
  useTranslation();
  const store = useOwnerItemsStore();
  const navigate = useNavigate();
  const favoriteRequests = useRef(new Set<string>());
  const [favoritePendingIds, setFavoritePendingIds] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [action, setAction] = useState<'unpublish' | 'delete'>('unpublish');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const item = store.items.find((entry) => entry.id === confirmId) ?? null;
  return (
    <>
      {actionError && <p role="alert">{t(actionError ?? '')}</p>}
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
        favoritePendingIds={favoritePendingIds}
        onFavoriteToggle={
          store.setFavorite
            ? (id, isFavorite) => {
                if (favoriteRequests.current.has(id)) return;
                favoriteRequests.current.add(id);
                setFavoritePendingIds([...favoriteRequests.current]);
                setActionError(null);
                void Promise.resolve()
                  .then(() => store.setFavorite!(id, isFavorite))
                  .catch((error) => setActionError(itemErrorMessage(error)))
                  .finally(() => {
                    favoriteRequests.current.delete(id);
                    setFavoritePendingIds([...favoriteRequests.current]);
                  });
              }
            : undefined
        }
        onPublish={
          store.publish
            ? (id) => {
                setActionError(null);
                store.setNotice('');
                void Promise.resolve()
                  .then(() => store.publish!(id))
                  .then(() => store.setNotice(t('Deine Anzeige wurde veröffentlicht.')))
                  .catch((error) => setActionError(itemErrorMessage(error)));
              }
            : undefined
        }
        onDelete={
          store.deleteItem
            ? (id) => {
                setAction('delete');
                setConfirmError(null);
                setConfirmId(id);
              }
            : undefined
        }
        onUnpublish={(id) => {
          setAction('unpublish');
          setConfirmError(null);
          setConfirmId(id);
        }}
        onRetry={store.retry}
      />
      <UnpublishItemDialog
        action={action}
        item={item}
        busy={store.busy}
        error={t(confirmError ?? '')}
        onCancel={() => setConfirmId(null)}
        onConfirm={async (id) => {
          setConfirmError(null);
          store.setNotice('');
          try {
            if (action === 'delete') await store.deleteItem!(id);
            else await store.unpublish(id);
            setConfirmId(null);
            store.setNotice(
              action === 'delete'
                ? t('Deine Anzeige wurde gelöscht.')
                : t('Deine Anzeige wurde ausgeblendet.'),
            );
          } catch (error) {
            setConfirmError(itemErrorMessage(error));
          }
        }}
      />
    </>
  );
}
