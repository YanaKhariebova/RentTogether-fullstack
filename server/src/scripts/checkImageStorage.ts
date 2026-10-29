import 'dotenv/config';
import sharp from 'sharp';
import { configureImageStorage } from '../modules/items/storage/configureImageStorage.js';
import { ImageUploadError } from '../modules/items/storage/ImageUploadError.js';

// Явный opt-in: создаёт только один временный объект и затем удаляет именно его.
async function check() {
  if (process.env.IMAGE_STORAGE !== 'cloudinary') {
    console.error('Set IMAGE_STORAGE=cloudinary in server/.env before running this check.');
    process.exitCode = 1;
    return;
  }
  const { imageStorage } = configureImageStorage(process.env);
  let key: string | undefined;
  try {
    const content = await sharp({
      create: { width: 8, height: 8, channels: 3, background: 'green' },
    })
      .png()
      .toBuffer();
    const uploaded = await imageStorage.upload({ content, contentType: 'image/png' });
    key = uploaded.key;
    console.log('Cloudinary upload passed.');
    const response = await fetch(imageStorage.getPublicUrl(key), {
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error('Public image URL did not return success.');
    const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
    if (metadata.width !== 8 || metadata.height !== 8) throw new Error('Invalid public image.');
    console.log('Public HTTPS image URL passed.');
  } catch (error) {
    if (error instanceof ImageUploadError) key = error.cleanupKey;
    console.error('Cloudinary check failed. Verify server credentials, permissions and network.');
    process.exitCode = 1;
  } finally {
    if (key) {
      try {
        await imageStorage.delete(key);
        console.log('Cloudinary deletion confirmed (CDN invalidation may take time).');
      } catch {
        console.error('Temporary check asset requires manual cleanup:', key);
        process.exitCode = 1;
      }
    }
  }
}
void check().catch(() => {
  console.error('Cloudinary configuration is incomplete or invalid. See server/.env.example.');
  process.exitCode = 1;
});
