import { useEffect, useRef, useState } from 'react';
import { mockCategories, mockOwnerItems } from '../mocks/items';
import { buildMockItem, unpublishMockItem } from '../model/mockItemChanges';
import type { ValidatedItemForm } from '../model/itemFormSchema';
import type { ItemImage, OwnerItem } from '../types/item';

const mockOwner = { id: 'mock-olga', name: 'Olga', city: 'Berlin' };
const loadMockItems = async (): Promise<OwnerItem[]> => structuredClone(mockOwnerItems);

// Только изолированный UI-стенд; приложение использует useOwnerItems с настоящим API.
export function useMockOwnerItems(loadItems = loadMockItems) {
  const [items, setItems] = useState<OwnerItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadKey, setReloadKey] = useState(0);
  const objectUrls = useRef(new Set<string>());

  useEffect(() => {
    let active = true;
    loadItems()
      .then((loaded) => {
        if (active) {
          setItems(loaded);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [loadItems, reloadKey]);

  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  function saveItem(form: ValidatedItemForm, id?: string) {
    const previous = id ? items.find((item) => item.id === id) : undefined;
    if (id && !previous) throw new Error('Anzeige nicht gefunden.');
    const newUrls: string[] = [];
    try {
      const images: ItemImage[] = form.images.map((image, order) => {
        if (image.kind === 'stored') {
          const stored = previous?.images.find((entry) => entry.id === image.id);
          if (!stored) throw new Error('Foto nicht gefunden.');
          return { ...stored, order };
        }
        // У кабинета собственный URL: форма освобождает свои URL при закрытии.
        const url = URL.createObjectURL(image.file);
        newUrls.push(url);
        return { id: image.id, url, order };
      });
      const saved = buildMockItem(
        form,
        mockCategories,
        mockOwner,
        images,
        previous?.id ?? crypto.randomUUID(),
        new Date().toISOString(),
        previous,
      );
      newUrls.forEach((url) => objectUrls.current.add(url));
      const retained = new Set(images.map((image) => image.url));
      previous?.images.forEach((image) => {
        if (!retained.has(image.url) && objectUrls.current.delete(image.url))
          URL.revokeObjectURL(image.url);
      });
      setItems((current) =>
        [saved, ...current.filter((item) => item.id !== saved.id)].sort(
          (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
        ),
      );
    } catch (error) {
      newUrls.forEach((url) => {
        objectUrls.current.delete(url);
        URL.revokeObjectURL(url);
      });
      throw error;
    }
  }

  return {
    items,
    status,
    saveItem,
    retry() {
      setStatus('loading');
      setReloadKey((key) => key + 1);
    },
    unpublish(id: string) {
      setItems((current) => unpublishMockItem(current, id, new Date().toISOString()));
    },
  };
}
