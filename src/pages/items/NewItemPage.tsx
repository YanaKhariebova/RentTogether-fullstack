import { ItemEditor } from "../../features/items/components/ItemEditor";
import type { ValidatedItemForm } from "../../features/items/model/itemFormSchema";

interface NewItemPageProps {
  onSave: (values: ValidatedItemForm) => void;
  onCancel: () => void;
}

export function NewItemPage(props: NewItemPageProps) {
  return <ItemEditor {...props} />;
}
