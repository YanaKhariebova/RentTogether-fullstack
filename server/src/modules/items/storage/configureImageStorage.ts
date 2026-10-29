import { ApiError } from '../../../lib/errors.js';
import type { ImageStorage } from './ImageStorage.js';
import type { CloudinaryGateway } from './cloudinaryImageStorage.js';
import { createCloudinaryImageStorage } from './cloudinaryImageStorage.js';
import { createLocalImageStorage, defaultUploadsDirectory } from './localImageStorage.js';

type Environment = Record<string, string | undefined>;
export function configureImageStorage(
  env: Environment,
  options: { localDirectory?: string; cloudinaryGateway?: CloudinaryGateway } = {},
) {
  const provider = env.IMAGE_STORAGE?.trim() || 'local';
  if (!['local', 'cloudinary'].includes(provider))
    throw new Error('IMAGE_STORAGE must be local or cloudinary.');
  if (env.NODE_ENV === 'production' && provider === 'local') {
    throw new Error('Use IMAGE_STORAGE=cloudinary in production.');
  }
  const local = createLocalImageStorage({
    directory: options.localDirectory,
    publicBaseUrl: env.IMAGE_PUBLIC_BASE_URL || `http://localhost:${env.PORT || 3000}/uploads/`,
  });
  let cloud: ImageStorage | undefined;
  if (
    provider === 'cloudinary' ||
    (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET)
  ) {
    cloud = createCloudinaryImageStorage(
      {
        cloudName: env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: env.CLOUDINARY_API_KEY || '',
        apiSecret: env.CLOUDINARY_API_SECRET || '',
        folder: env.CLOUDINARY_FOLDER,
      },
      options.cloudinaryGateway,
    );
  }
  function storageFor(key: string) {
    if (!key.startsWith('cloudinary:')) return local;
    if (!cloud)
      throw new ApiError(
        503,
        'IMAGE_STORAGE_NOT_CONFIGURED',
        'Der Fotospeicher ist nicht eingerichtet.',
      );
    return cloud;
  }
  const imageStorage: ImageStorage = {
    upload: (image) => (provider === 'cloudinary' ? cloud! : local).upload(image),
    delete: (key) => storageFor(key).delete(key),
    getPublicUrl: (key) => storageFor(key).getPublicUrl(key),
  };
  // Старые локальные фотографии продолжают открываться при переходе на Cloudinary.
  return {
    provider,
    imageStorage,
    localUploadsDirectory: options.localDirectory ?? defaultUploadsDirectory,
  };
}
