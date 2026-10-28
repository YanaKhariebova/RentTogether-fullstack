import { useEffect, useRef, useState } from 'react';
import type { FormImage } from '../model/itemFormSchema';
import { moveImage, validateImageSelection } from '../model/imageSelection';

export interface PreviewImage {
  id: string;
  url: string;
  name: string;
  image: FormImage;
}

export function useItemImages(initialImages: Extract<FormImage, { kind: 'stored' }>[] = []) {
  const [images, setImages] = useState<PreviewImage[]>(() =>
    initialImages.map((image) => ({
      id: image.id,
      url: image.url,
      name: 'Gespeichertes Foto',
      image,
    })),
  );
  const [errors, setErrors] = useState<string[]>([]);
  const objectUrls = useRef(new Set<string>());

  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  function addFiles(files: File[]) {
    const result = validateImageSelection(files, images.length);
    const added = result.accepted.map((file): PreviewImage => {
      const id = crypto.randomUUID();
      const url = URL.createObjectURL(file);
      objectUrls.current.add(url);
      return { id, url, name: file.name, image: { kind: 'local', id, file } };
    });
    setImages((current) => [...current, ...added]);
    setErrors(result.errors);
  }

  function removeImage(id: string) {
    const removed = images.find((image) => image.id === id);
    if (removed && objectUrls.current.delete(removed.url)) URL.revokeObjectURL(removed.url);
    setImages((current) => current.filter((image) => image.id !== id));
    setErrors([]);
  }

  function reorderImage(id: string, direction: -1 | 1) {
    setImages((current) => moveImage(current, id, direction));
  }

  return { images, errors, addFiles, removeImage, reorderImage };
}
