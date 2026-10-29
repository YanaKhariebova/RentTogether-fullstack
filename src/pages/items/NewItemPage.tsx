import { ItemEditor } from '../../features/items/components/ItemEditor';
import type { ItemCategory } from '../../features/items/types/item';
import type { ValidatedItemForm } from '../../features/items/model/itemFormSchema';

interface NewItemPageProps {
  categories: ItemCategory[];
  defaultCity?: string;
  onSave: (values: ValidatedItemForm) => void | Promise<void>;
  onCancel: () => void;
}

export function NewItemPage(props: NewItemPageProps) {
  return <ItemEditor {...props} />;
}
