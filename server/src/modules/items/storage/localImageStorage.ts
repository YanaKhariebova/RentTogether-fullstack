import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ImageStorage } from './ImageStorage.js';

// Путь не зависит от запуска из корня проекта или через npm --prefix server.
export const defaultUploadsDirectory = fileURLToPath(
  new URL('../../../../uploads/', import.meta.url),
);
const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const;

export function createLocalImageStorage(options: {
  directory?: string;
  publicBaseUrl: string;
}): ImageStorage {
  const directory = path.resolve(options.directory ?? defaultUploadsDirectory);
  const publicBase = new URL(options.publicBaseUrl);
  if (
    !['http:', 'https:'].includes(publicBase.protocol) ||
    publicBase.username ||
    publicBase.password ||
    publicBase.search ||
    publicBase.hash
  ) {
    throw new Error('Image public URL must be an HTTP(S) URL without credentials, query or hash.');
  }
  publicBase.pathname = `${publicBase.pathname.replace(/\/$/, '')}/`;

  function filePath(key: string) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/i.test(key)
    ) {
      throw new Error('Invalid local image key.');
    }
    return path.join(directory, key);
  }

  return {
    async upload({ content, contentType }) {
      const key = `${randomUUID()}.${extensions[contentType]}`;
      await mkdir(directory, { recursive: true });
      const filename = filePath(key);
      try {
        await writeFile(filename, content, { flag: 'wx' });
      } catch (error) {
        // При ошибке записи на диск не оставляем недописанный файл.
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
          await unlink(filename).catch(() => {});
        }
        throw error;
      }
      return { key };
    },
    async delete(key) {
      try {
        await unlink(filePath(key));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
    },
    getPublicUrl(key) {
      filePath(key);
      return new URL(key, publicBase).toString();
    },
  };
}
