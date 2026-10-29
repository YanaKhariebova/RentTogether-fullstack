import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const allowedTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function imageExtension(contentType: string | undefined) {
  return allowedTypes.get(contentType?.toLowerCase() ?? '');
}

export function uploadsDirectory() {
  return path.resolve(process.cwd(), 'uploads');
}

export async function storeImage(storageKey: string, content: Buffer) {
  const directory = uploadsDirectory();
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, storageKey), content, { flag: 'wx' });
}

export async function removeStoredImage(storageKey: string | null) {
  if (!storageKey) return;
  try {
    await unlink(path.join(uploadsDirectory(), storageKey));
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}
