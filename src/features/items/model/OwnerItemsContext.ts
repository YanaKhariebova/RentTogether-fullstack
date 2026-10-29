import { createContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { useOwnerItems } from '../hooks/useOwnerItems';
export type OwnerItemsStore = ReturnType<typeof useOwnerItems> & {
  notice: string;
  setNotice: Dispatch<SetStateAction<string>>;
};
export const OwnerItemsContext = createContext<OwnerItemsStore | null>(null);
