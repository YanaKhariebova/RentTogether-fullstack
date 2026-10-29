import { ApiError } from '../../../lib/errors.js';

// Даже при потере ответа Cloudinary известен заранее назначенный public_id.
// Сервис сможет удалить возможный объект или поставить его в очередь очистки.
export class ImageUploadError extends ApiError {
  constructor(
    public readonly cleanupKey: string,
    cause: unknown,
  ) {
    super(
      503,
      'IMAGE_STORAGE_UNAVAILABLE',
      'Das Foto konnte nicht hochgeladen werden. Bitte versuche es erneut.',
      {
        images: ['Der Fotospeicher ist vorübergehend nicht verfügbar.'],
      },
    );
    this.cause = cause;
  }
}
