import { createContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { useMockOwnerItems } from '../hooks/useMockOwnerItems';
export type OwnerItemsStore = ReturnType<typeof useMockOwnerItems> & {
  notice: string;
  setNotice: Dispatch<SetStateAction<string>>;
};
export const OwnerItemsContext = createContext<OwnerItemsStore | null>(null);
