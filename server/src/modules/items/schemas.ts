import { z } from 'zod';

const itemFields = {
  title: z.string().trim().min(3, 'Mindestens 3 Zeichen.').max(100, 'Höchstens 100 Zeichen.'),
  description: z
    .string()
    .trim()
    .min(10, 'Mindestens 10 Zeichen.')
    .max(5000, 'Höchstens 5000 Zeichen.'),
  city: z.string().trim().min(2, 'Bitte gib einen Ort ein.').max(100, 'Höchstens 100 Zeichen.'),
  categoryId: z.uuid('Bitte wähle eine gültige Kategorie aus.'),
  pricePerDay: z
    .string()
    .regex(/^\d{1,6}\.\d{2}$/, 'Bitte gib den Preis in Euro an, zum Beispiel 15.50.')
    .refine((value) => Number(value) > 0, 'Der Preis muss größer als 0 sein.'),
};

// ownerId, Bilder und Veröffentlichungsstatus werden nicht beim Erstellen angenommen.
export const createItemSchema = z.strictObject(itemFields);
export const updateItemSchema = z
  .strictObject({ ...itemFields, isPublished: z.boolean() })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Bitte ändere mindestens ein Feld.');
export const itemParamsSchema = z.object({ id: z.uuid('Ungültige Anzeigen-ID.') });

const optionalQueryText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength, `Höchstens ${maxLength} Zeichen.`)
    .optional()
    .transform((value) => value || undefined);

const queryPrice = z
  .string()
  .regex(/^\d{1,6}\.\d{2}$/, 'Bitte gib den Preis in Euro an, zum Beispiel 15.50.')
  .refine((value) => Number(value) >= 0, 'Der Preis darf nicht negativ sein.');

export const publicItemsQuerySchema = z
  .object({
    q: optionalQueryText(100),
    city: optionalQueryText(100),
    categoryId: z.uuid('Bitte wähle eine gültige Kategorie aus.').optional(),
    minPrice: queryPrice.optional(),
    maxPrice: queryPrice.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  })
  .strict()
  .refine(
    (query) =>
      !query.minPrice || !query.maxPrice || Number(query.minPrice) <= Number(query.maxPrice),
    { message: 'Der Mindestpreis darf nicht höher als der Höchstpreis sein.', path: ['minPrice'] },
  );

export type CreateItemData = z.infer<typeof createItemSchema>;
export type UpdateItemData = z.infer<typeof updateItemSchema>;
export type PublicItemsQuery = z.infer<typeof publicItemsQuerySchema>;
