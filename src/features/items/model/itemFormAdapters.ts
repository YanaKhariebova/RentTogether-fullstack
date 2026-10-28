import type { ItemFormValues, ValidatedItemForm } from './itemFormSchema';
import type { CreateItemInput, OwnerItem } from '../types/item';

export function toCreateItemInput(form: ValidatedItemForm): CreateItemInput {
  const cents = form.pricePerDay;
  return {
    title: form.title,
    description: form.description,
    city: form.city,
    categoryId: form.categoryId,
    pricePerDay: `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`,
  };
}

export function toItemFormValues(item: OwnerItem): ItemFormValues {
  return {
    title: item.title,
    description: item.description,
    city: item.city,
    categoryId: item.category.id,
    pricePerDay: item.pricePerDay.replace('.', ','),
    images: [...item.images]
      .sort((a, b) => a.order - b.order)
      .map((image) => ({ kind: 'stored', id: image.id, url: image.url })),
  };
}
