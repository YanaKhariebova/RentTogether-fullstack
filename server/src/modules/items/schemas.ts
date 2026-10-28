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

export type CreateItemData = z.infer<typeof createItemSchema>;
export type UpdateItemData = z.infer<typeof updateItemSchema>;
