import { toCreateItemInput } from './itemFormAdapters.ts';
import type { ValidatedItemForm } from './itemFormSchema';
import type { OwnerItem, OwnerItemResponse, OwnerItemsResponse, ItemImage } from '../types/item';

export type ItemRequest = <T>(path: string, options?: RequestInit) => Promise<T>;

// Одна сессия на открытую форму. Запоминаем уже подтверждённые сервером шаги
// после частичного сбоя; повторное нажатие не создаёт второй известный черновик.
export function createOwnerItemSaveSession(request: ItemRequest, existingId?: string) {
  let itemId = existingId;
  let restorePublished: boolean | undefined;
  const uploaded = new Map<string, ItemImage>();
  let saving = false;

  return {
    get itemId() {
      return itemId;
    },
    async save(form: ValidatedItemForm): Promise<OwnerItem> {
      if (saving) throw new Error('Die Anzeige wird bereits gespeichert.');
      saving = true;
      try {
        const input = toCreateItemInput(form);
        let item: OwnerItem;
        if (itemId) {
          const { items } = await request<OwnerItemsResponse>('/my/items');
          const current = items.find((entry) => entry.id === itemId);
          if (!current)
            throw new Error('Die Anzeige wurde nicht gefunden. Bitte lade deine Anzeigen neu.');
          item = current;
        } else {
          const created = await request<OwnerItemResponse>('/items', {
            method: 'POST',
            body: JSON.stringify(input),
          });
          item = created.item;
          itemId = item.id;
        }
        restorePublished ??= item.isPublished;
        const storedIds = new Set(item.images.map((image) => image.id));
        const desiredIds: string[] = [];
        for (const image of form.images) {
          const id = image.kind === 'stored' ? image.id : uploaded.get(image.id)?.id;
          if (image.kind === 'stored' && !storedIds.has(image.id)) {
            throw new Error('Die Fotos haben sich geändert. Bitte öffne die Anzeige erneut.');
          }
          if (id && storedIds.has(id)) desiredIds.push(id);
          else if (image.kind === 'local') uploaded.delete(image.id);
        }
        const retained = new Set(desiredIds);
        const removed = item.images.filter((image) => !retained.has(image.id));
        const hasNew = form.images.some(
          (image) => image.kind === 'local' && !uploaded.has(image.id),
        );
        const photosChanged =
          removed.length > 0 ||
          hasNew ||
          desiredIds.some((id, index) => item.images[index]?.id !== id);
        if (item.isPublished && photosChanged) {
          await request(`/items/${item.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ isPublished: false }),
          });
        }
        await request(`/items/${item.id}`, { method: 'PATCH', body: JSON.stringify(input) });
        // Освобождаем места до загрузки, чтобы можно было заменить все восемь фото.
        for (const image of removed) {
          await request(`/items/${item.id}/images/${image.id}`, { method: 'DELETE' });
        }
        for (const image of form.images) {
          if (image.kind !== 'local' || uploaded.has(image.id)) continue;
          const saved = await request<{ image: ItemImage }>(`/items/${item.id}/images`, {
            method: 'POST',
            body: image.file,
            headers: { 'Content-Type': image.file.type },
          });
          uploaded.set(image.id, saved.image);
        }
        const imageIds = form.images.map((image) =>
          image.kind === 'stored' ? image.id : uploaded.get(image.id)!.id,
        );
        await request(`/items/${item.id}/images/order`, {
          method: 'PUT',
          body: JSON.stringify({ imageIds }),
        });
        // При сбое опубликованная вещь с изменяемыми фото остаётся скрытой;
        // возвращаем статус только после завершения всех шагов.
        const result = await request<OwnerItemResponse>(`/items/${item.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isPublished: restorePublished }),
        });
        return result.item;
      } finally {
        saving = false;
      }
    },
  };
}
