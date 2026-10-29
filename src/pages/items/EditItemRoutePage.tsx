import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { EditItemPage } from './EditItemPage';
import { useOwnerItemsStore } from '@/features/items/hooks/useOwnerItemsStore';
import { Button, Spinner } from '@/shared/ui/atoms';
export function EditItemRoutePage() {
  const { itemId } = useParams({ from: '/account/items/$itemId/edit' });
  const store = useOwnerItemsStore();
  const [sessionKey] = useState(() => crypto.randomUUID());
  const navigate = useNavigate();
  const item = store.items.find((entry) => entry.id === itemId);
  const back = () => {
    void navigate({ to: '/account/items' });
  };
  if (store.status === 'loading' || store.categoriesStatus === 'loading') return <Spinner />;
  if (store.status === 'error' || store.categoriesStatus === 'error')
    return (
      <div role="alert">
        <p>Deine Anzeige konnte nicht geladen werden.</p>
        <Button
          onClick={() => {
            store.retry();
            store.retryCategories();
          }}
        >
          Erneut versuchen
        </Button>
      </div>
    );
  if (!item)
    return (
      <section>
        <h1>Anzeige nicht gefunden</h1>
        <p>Diese Anzeige existiert nicht oder gehört einem anderen Mitglied.</p>
        <Button onClick={back}>Meine Anzeigen</Button>
      </section>
    );
  return (
    <EditItemPage
      categories={store.categories}
      item={item}
      onCancel={back}
      onSave={async (values) => {
        await store.saveItem(values, item.id, sessionKey);
        store.setNotice('Deine Änderungen wurden gespeichert.');
        back();
      }}
    />
  );
}
