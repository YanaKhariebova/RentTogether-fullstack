import { useNavigate } from '@tanstack/react-router';
import { NewItemPage } from './NewItemPage';
import { useOwnerItemsStore } from '@/features/items/hooks/useOwnerItemsStore';
export function NewItemRoutePage() {
  const store = useOwnerItemsStore();
  const navigate = useNavigate();
  const back = () => {
    void navigate({ to: '/account/items' });
  };
  return (
    <NewItemPage
      onCancel={back}
      onSave={async (values) => {
        await store.saveItem(values);
        store.setNotice('Deine Anzeige wurde gespeichert.');
        back();
      }}
    />
  );
}
