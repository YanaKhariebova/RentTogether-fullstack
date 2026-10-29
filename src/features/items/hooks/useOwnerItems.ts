import { useCallback, useEffect, useState } from 'react';
import { useApi } from '@/features/auth/api/useApi';
import type { OwnerItemsResponse, OwnerItem, OwnerItemResponse } from '../types/item';
import { toCreateItemInput } from '../model/itemFormAdapters';
import type { ValidatedItemForm } from '../model/itemFormSchema';

type Status = 'loading' | 'ready' | 'error';

export function useOwnerItems() {
  const api = useApi();
  const [items, setItems] = useState<OwnerItem[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await api<OwnerItemsResponse>('/my/items');
      setItems(response.items);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [api]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reload();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  const saveItem = useCallback(
    async (form: ValidatedItemForm, id?: string) => {
      const input = toCreateItemInput(form);
      const response = id
        ? await api<OwnerItemResponse>(`/items/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(input),
          })
        : await api<OwnerItemResponse>('/items', { method: 'POST', body: JSON.stringify(input) });
      const itemId = response.item.id;
      const previous = id ? items.find((item) => item.id === id) : undefined;
      const wantedStoredIds = new Set(
        form.images.filter((image) => image.kind === 'stored').map((image) => image.id),
      );
      await Promise.all(
        (previous?.images ?? [])
          .filter((image) => !wantedStoredIds.has(image.id))
          .map((image) => api<void>(`/items/${itemId}/images/${image.id}`, { method: 'DELETE' })),
      );
      const uploaded = new Map<string, string>();
      for (const image of form.images) {
        if (image.kind !== 'local') continue;
        const result = await api<{ image: { id: string } }>(`/items/${itemId}/images`, {
          method: 'POST',
          body: image.file,
          headers: { 'Content-Type': image.file.type },
        });
        uploaded.set(image.id, result.image.id);
      }
      const imageIds = form.images.map((image) =>
        image.kind === 'stored' ? image.id : uploaded.get(image.id)!,
      );
      await api<void>(`/items/${itemId}/images/order`, {
        method: 'PUT',
        body: JSON.stringify({ imageIds }),
      });
      await reload();
    },
    [api, items, reload],
  );

  const unpublish = useCallback(
    async (id: string) => {
      await api<OwnerItemResponse>(`/items/${id}`, { method: 'DELETE' });
      await reload();
    },
    [api, reload],
  );

  return { items, status, saveItem, unpublish, retry: reload };
}
