import { ItemEditor } from '../../features/items/components/ItemEditor';
import type { ValidatedItemForm } from '../../features/items/model/itemFormSchema';
import type { OwnerItem } from '../../features/items/types/item';

interface EditItemPageProps {
  item: OwnerItem;
  onSave: (values: ValidatedItemForm) => void;
  onCancel: () => void;
}

export function EditItemPage({ item, ...props }: EditItemPageProps) {
  return <ItemEditor key={item.id} item={item} {...props} />;
}
