export type ImageContentType = 'image/jpeg' | 'image/png' | 'image/webp';

// Ключ непрозрачен для API/UI. Адаптер сам генерирует его, клиент ключ не задаёт.
export interface ImageStorage {
  upload(image: { content: Buffer; contentType: ImageContentType }): Promise<{ key: string }>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
