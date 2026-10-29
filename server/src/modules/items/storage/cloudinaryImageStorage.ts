import { randomUUID } from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiOptions } from 'cloudinary';
import { ApiError } from '../../../lib/errors.js';
import type { ImageStorage } from './ImageStorage.js';
import { ImageUploadError } from './ImageUploadError.js';

type CloudAsset = { public_id: string; version: number; format: string };
export interface CloudinaryGateway {
  upload(content: Buffer, options: UploadApiOptions): Promise<CloudAsset>;
  destroy(publicId: string, options: UploadApiOptions): Promise<unknown>;
}
const sdkGateway: CloudinaryGateway = {
  upload(content, options) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) reject(error);
        else if (!result) reject(new Error('Cloudinary returned no asset.'));
        else resolve(result);
      });
      stream.on('error', reject);
      stream.end(content);
    });
  },
  async destroy(publicId, options) {
    return cloudinary.uploader.destroy(publicId, options);
  },
};
const formats = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const;
const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

export function createCloudinaryImageStorage(
  config: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    folder?: string;
  },
  gateway: CloudinaryGateway = sdkGateway,
): ImageStorage {
  const cloudName = config.cloudName.trim();
  const apiKey = config.apiKey.trim();
  const apiSecret = config.apiSecret.trim();
  const folder = config.folder?.trim() || 'renttogether/items';
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(cloudName) || !apiKey || !apiSecret) {
    throw new Error(
      'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are required.',
    );
  }
  if (folder.length > 200 || !/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(folder)) {
    throw new Error(
      'CLOUDINARY_FOLDER must be a slash-separated path of letters, digits, underscores or hyphens.',
    );
  }
  const credentials = { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret };
  function keyFor(publicId: string, version: number, format: string) {
    return `cloudinary:${cloudName}:${version}:${format}:${publicId}`;
  }
  function parse(key: string) {
    const match = /^cloudinary:([a-z0-9_-]+):([1-9]\d*):(jpg|png|webp):([a-zA-Z0-9_/-]+)$/.exec(
      key,
    );
    if (
      !match ||
      !Number.isSafeInteger(Number(match[2])) ||
      match[1] !== cloudName ||
      !new RegExp(`^(?:[a-zA-Z0-9_-]+/)+${uuid}$`, 'i').test(match[4])
    ) {
      throw new Error('Invalid Cloudinary image key or cloud account mismatch.');
    }
    return { publicId: match[4], version: Number(match[2]), format: match[3] };
  }
  return {
    async upload({ content, contentType }) {
      const publicId = `${folder}/${randomUUID()}`;
      const format = formats[contentType];
      const cleanupKey = keyFor(publicId, 1, format);
      try {
        const asset = await gateway.upload(content, {
          ...credentials,
          public_id: publicId,
          resource_type: 'image',
          type: 'upload',
          format,
          overwrite: false,
          unique_filename: false,
          timeout: 30_000,
        });
        if (
          asset.public_id !== publicId ||
          asset.format !== format ||
          !Number.isSafeInteger(asset.version) ||
          asset.version < 1
        ) {
          throw new Error('Invalid Cloudinary asset response.');
        }
        return { key: keyFor(publicId, asset.version, format) };
      } catch (error) {
        // В API отдаётся только понятное сообщение; детали SDK и credentials не выдаются.
        throw new ImageUploadError(cleanupKey, error);
      }
    },
    async delete(key) {
      const { publicId } = parse(key);
      try {
        const result = await gateway.destroy(publicId, {
          ...credentials,
          resource_type: 'image',
          type: 'upload',
          invalidate: true,
          timeout: 30_000,
        });
        if (
          typeof result !== 'object' ||
          result === null ||
          !('result' in result) ||
          !['ok', 'not found'].includes(String(result.result))
        ) {
          throw new Error('Cloudinary did not confirm deletion.');
        }
      } catch (error) {
        const failure = new ApiError(
          503,
          'IMAGE_STORAGE_UNAVAILABLE',
          'Das Foto kann derzeit nicht entfernt werden.',
        );
        failure.cause = error;
        throw failure;
      }
    },
    getPublicUrl(key) {
      const { publicId, version, format } = parse(key);
      return cloudinary.url(publicId, {
        cloud_name: cloudName,
        secure: true,
        resource_type: 'image',
        type: 'upload',
        version,
        format,
        analytics: false,
      });
    },
  };
}
