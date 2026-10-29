import { toCreateItemInput } from './itemFormAdapters.ts';
import type { ValidatedItemForm } from './itemFormSchema.ts';
import type { ItemCategory, ItemImage, ItemOwner, OwnerItem } from '../types/item.ts';

// Только локальный стенд. Проверку владельца в API это не заменяет.
export function buildMockItem(
  form: ValidatedItemForm,
  categories: ItemCategory[],
  owner: ItemOwner,
  images: ItemImage[],
  id: string,
  now: string,
  previous?: OwnerItem,
): OwnerItem {
  const category = categories.find((entry) => entry.id === form.categoryId);
  if (!category) throw new Error('Kategorie nicht gefunden.');
  const fields = toCreateItemInput(form);
  return {
    title: fields.title,
    description: fields.description,
    city: fields.city,
    pricePerDay: fields.pricePerDay,
    id,
    category,
    owner,
    images,
    // Новая локальная Anzeige опубликована; редактирование сохраняет статус.
    isPublished: previous?.isPublished ?? true,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };
}

export function unpublishMockItem(items: OwnerItem[], id: string, now: string): OwnerItem[] {
  return items.map((item) =>
    item.id === id ? { ...item, isPublished: false, updatedAt: now } : item,
  );
}
