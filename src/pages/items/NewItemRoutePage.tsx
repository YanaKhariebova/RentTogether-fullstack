import { useTranslation } from 'react-i18next';
import { translate as t } from '../../i18n/config';
import { useState } from 'react';
import { Button, Spinner } from '@/shared/ui/atoms';
import { useNavigate } from '@tanstack/react-router';
import { NewItemPage } from './NewItemPage';
import { useOwnerItemsStore } from '@/features/items/hooks/useOwnerItemsStore';
export function NewItemRoutePage() {
  useTranslation();
  const store = useOwnerItemsStore();
  const [sessionKey] = useState(() => crypto.randomUUID());
  const navigate = useNavigate();
  const back = () => {
    void navigate({ to: '/account/items' });
  };
  if (store.categoriesStatus === 'loading')
    return <Spinner label={t('Kategorien werden geladen …')} />;
  if (store.categoriesStatus === 'error' || store.categories.length === 0)
    return (
      <section role="alert">
        <p>{t('Kategorien konnten nicht geladen werden.')}</p>
        <Button onClick={store.retryCategories}>{t('Erneut versuchen')}</Button>
      </section>
    );
  return (
    <NewItemPage
      categories={store.categories}
      defaultCity={store.defaultCity}
      onCancel={back}
      onSave={async (values) => {
        await store.saveItem(values, undefined, sessionKey);
        store.setNotice(
          t('Deine Anzeige wurde als Entwurf gespeichert. Du kannst sie jetzt veröffentlichen.'),
        );
        back();
      }}
    />
  );
}
