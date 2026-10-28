import { useNavigate, useParams } from '@tanstack/react-router';
import { EditItemPage } from './EditItemPage';
import { useOwnerItemsStore } from '@/features/items/hooks/useOwnerItemsStore';
import { Button, Spinner } from '@/shared/ui/atoms';
export function EditItemRoutePage() {
  const { itemId } = useParams({ from: '/account/items/$itemId/edit' });
  const store = useOwnerItemsStore();
  const navigate = useNavigate();
  const item = store.items.find((entry) => entry.id === itemId);
  const back = () => {
    void navigate({ to: '/account/items' });
  };
  if (store.status === 'loading') return <Spinner />;
  if (store.status === 'error')
    return (
      <div role="alert">
        <p>Deine Anzeige konnte nicht geladen werden.</p>
        <Button onClick={store.retry}>Erneut versuchen</Button>
      </div>
    );
  if (!item)
    return (
      <section>
        <h1>Anzeige nicht gefunden</h1>
        <p>Die Demo-Daten werden beim Neuladen zurückgesetzt.</p>
        <Button onClick={back}>Meine Anzeigen</Button>
      </section>
    );
  return (
    <EditItemPage
      item={item}
      onCancel={back}
      onSave={(values) => {
        store.saveItem(values, item.id);
        store.setNotice('Deine Änderungen wurden lokal gespeichert.');
        back();
      }}
    />
  );
}
