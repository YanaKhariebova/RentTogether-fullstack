import { useContext } from 'react';
import { OwnerItemsContext } from '../model/OwnerItemsContext';
export function useOwnerItemsStore() {
  const store = useContext(OwnerItemsContext);
  if (!store) throw new Error('OwnerItemsProvider is required.');
  return store;
}
