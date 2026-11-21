import { translate as t } from '../../i18n/config';
import type { ApiErrorBody } from './types';

export class ApiError extends Error {
  status: number;
  detail: ApiErrorBody['error'];
  constructor(status: number, detail: ApiErrorBody['error']) {
    super(t(detail.message));
    this.status = status;
    this.detail = detail;
  }
}

export function createApiClient(
  getToken: () => Promise<string | null>,
  baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
) {
  return async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await getToken();
    const headers = new Headers(options.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (typeof options.body === 'string' && !headers.has('Content-Type'))
      headers.set('Content-Type', 'application/json');
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, { ...options, headers });
    } catch {
      throw new ApiError(0, {
        code: 'NETWORK_ERROR',
        message: t('Die Verbindung ist fehlgeschlagen. Bitte versuche es erneut.'),
        fields: {},
      });
    }
    const body = await response.json().catch(() => null);
    if (!response.ok)
      throw new ApiError(
        response.status,
        body?.error ?? {
          code: 'HTTP_ERROR',
          message: t('Die Anfrage ist fehlgeschlagen.'),
          fields: {},
        },
      );
    return body as T;
  };
}
