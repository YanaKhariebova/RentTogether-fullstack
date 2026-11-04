import { ApiError } from '@/shared/api/client';
import type { ItemFormValues } from './itemFormSchema';

export function itemFieldErrors(error: unknown): Partial<Record<keyof ItemFormValues, string>> {
  const cause = error instanceof Error && error.cause instanceof ApiError ? error.cause : error;
  if (!(cause instanceof ApiError)) return {};
  const errors: Partial<Record<keyof ItemFormValues, string>> = {};
  for (const field of [
    'title',
    'description',
    'city',
    'categoryId',
    'pricePerDay',
    'images',
  ] as const) {
    const messages = cause.detail.fields?.[field];
    if (messages?.length) errors[field] = messages.join(' ');
  }
  if (
    !errors.city &&
    (cause.detail.code === 'CITY_NOT_FOUND' || cause.detail.code.startsWith('LOCATION_'))
  ) {
    errors.city = cause.message;
  }
  if (!errors.images && ['INVALID_IMAGE', 'IMAGE_TOO_LARGE'].includes(cause.detail.code)) {
    errors.images = cause.message;
  }
  return errors;
}

export function itemErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const details = Object.values(error.detail.fields ?? {})
      .flat()
      .join(' ');
    return details || error.message;
  }
  return error instanceof Error
    ? error.message
    : 'Speichern fehlgeschlagen. Bitte versuche es erneut.';
}
