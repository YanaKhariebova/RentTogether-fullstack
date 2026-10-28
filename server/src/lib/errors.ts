import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join('.') || '_form';
      (fields[key] ??= []).push(issue.message);
    }
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Bitte überprüfe deine Eingaben.', fields },
    });
    return;
  }
  if (error instanceof ApiError) {
    res
      .status(error.status)
      .json({ error: { code: error.code, message: error.message, fields: error.fields } });
    return;
  }
  if (error instanceof SyntaxError && 'body' in error) {
    res
      .status(400)
      .json({ error: { code: 'INVALID_JSON', message: 'Ungültiges JSON.', fields: {} } });
    return;
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large'
  ) {
    res.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Die Anfrage ist zu groß.', fields: {} },
    });
    return;
  }
  console.error(error);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Ein unerwarteter Fehler ist aufgetreten.',
      fields: {},
    },
  });
};
