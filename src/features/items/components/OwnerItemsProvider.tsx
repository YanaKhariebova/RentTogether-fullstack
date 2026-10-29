import { useState } from 'react';
import type { ReactNode } from 'react';
import { useOwnerItems } from '../hooks/useOwnerItems';
import { OwnerItemsContext } from '../model/OwnerItemsContext';
// Provider перемонтируется при смене Clerk-пользователя; формы и notices изолированы.
export function OwnerItemsProvider({ children }: { children: ReactNode }) {
  const store = useOwnerItems();
  const [notice, setNotice] = useState('');
  return (
    <OwnerItemsContext.Provider value={{ ...store, notice, setNotice }}>
      {children}
    </OwnerItemsContext.Provider>
  );
}
