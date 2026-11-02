import { z } from 'zod';

export const favoriteItemParamsSchema = z.object({ id: z.uuid('Ungültige Anzeigen-ID.') });
