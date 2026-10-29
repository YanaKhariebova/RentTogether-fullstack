import { ApiError } from '@/shared/api/client';
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
