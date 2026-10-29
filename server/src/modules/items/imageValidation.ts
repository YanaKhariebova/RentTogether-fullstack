import sharp from 'sharp';
import { ApiError } from '../../lib/errors.js';
import type { ImageContentType } from './storage/ImageStorage.js';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_ITEM_IMAGES = 8;
const formats = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' } as const;

export async function validateImage(content: unknown, header: string | undefined) {
  const contentType = header?.split(';')[0].trim().toLowerCase() as ImageContentType;
  if (!Object.hasOwn(formats, contentType) || !Buffer.isBuffer(content) || content.length === 0) {
    throw new ApiError(400, 'INVALID_IMAGE', 'Bitte lade ein JPEG-, PNG- oder WebP-Bild hoch.', {
      images: ['Erlaubt sind nicht leere JPEG-, PNG- und WebP-Dateien.'],
    });
  }
  if (content.length > MAX_IMAGE_BYTES) {
    throw new ApiError(413, 'IMAGE_TOO_LARGE', 'Ein Bild darf höchstens 5 MB groß sein.');
  }
  try {
    const image = sharp(content, { limitInputPixels: 25_000_000, failOn: 'warning' });
    const metadata = await image.metadata();
    if (metadata.format !== formats[contentType] || (metadata.pages ?? 1) !== 1)
      throw new Error('Invalid format');
    // Декодируем пиксели, а не только заголовок; убираем EXIF/GPS и вложенные данные.
    const normalized = await image
      .rotate()
      .toFormat(formats[contentType])
      .timeout({ seconds: 5 })
      .toBuffer();
    if (normalized.length > MAX_IMAGE_BYTES) {
      throw new ApiError(413, 'IMAGE_TOO_LARGE', 'Ein Bild darf höchstens 5 MB groß sein.');
    }
    return { content: normalized, contentType };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      400,
      'INVALID_IMAGE',
      'Das Foto ist beschädigt oder hat ein ungültiges Format.',
      {
        images: ['Bitte wähle ein gültiges Foto (maximal 25 Megapixel, ohne Animation).'],
      },
    );
  }
}
