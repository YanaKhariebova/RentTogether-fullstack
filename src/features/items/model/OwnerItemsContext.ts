import { createContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ValidatedItemForm } from './itemFormSchema';
import type { ItemCategory, OwnerItem } from '../types/item';
export interface OwnerItemsStore {
  items: OwnerItem[];
  loadError?: string | null;
  status: 'loading' | 'ready' | 'error';
  categories: ItemCategory[];
  categoriesStatus: 'loading' | 'ready' | 'error';
  defaultCity: string;
  busy: boolean;
  saveItem: (
    form: ValidatedItemForm,
    id: string | undefined,
    sessionKey: string,
  ) => void | Promise<void>;
  setFavorite?: (id: string, isFavorite: boolean) => void | Promise<void>;
  deleteItem?: (id: string) => void | Promise<void>;
  unpublish: (id: string) => void | Promise<void>;
  publish?: (id: string) => void | Promise<void>;
  retry: () => void;
  retryCategories: () => void;
  notice: string;
  setNotice: Dispatch<SetStateAction<string>>;
}
export const OwnerItemsContext = createContext<OwnerItemsStore | null>(null);
