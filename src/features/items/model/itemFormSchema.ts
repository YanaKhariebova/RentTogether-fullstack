import { z } from 'zod';

// Рабочие ограничения для MVP; сервер обязан проверять их независимо.
export const MAX_ITEM_IMAGES = 8;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const itemImageFileSchema = z
  .instanceof(File, { error: 'Bitte wähle eine Bilddatei aus.' })
  .refine((file) => file.size > 0, 'Die Datei ist leer.')
  .refine((file) => file.size <= MAX_IMAGE_SIZE_BYTES, 'Ein Bild darf höchstens 5 MB groß sein.')
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.some((type) => type === file.type),
    'Erlaubt sind JPEG, PNG und WebP.',
  );

// У сохранённого фото есть URL, у нового — файл для будущей загрузки.
export const formImageSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('stored'),
    id: z.string().min(1),
    url: z.string().min(1),
  }),
  z.object({
    kind: z.literal('local'),
    id: z.string().min(1),
    file: itemImageFileSchema,
  }),
]);

export const priceFieldSchema = z
  .string()
  .trim()
  .regex(
    /^\d{1,6}([.,]\d{1,2})?$/,
    'Bitte gib einen Preis mit höchstens zwei Nachkommastellen ein.',
  )
  .transform((value) => {
    const [euros, cents = ''] = value.replace(',', '.').split('.');
    return Number(euros) * 100 + Number(cents.padEnd(2, '0'));
  })
  .pipe(z.number().int().positive('Der Preis muss größer als 0 sein.'));

export const itemFormSchema = z.object({
  title: z.string().trim().min(3, 'Mindestens 3 Zeichen.').max(100, 'Höchstens 100 Zeichen.'),
  description: z
    .string()
    .trim()
    .min(10, 'Mindestens 10 Zeichen.')
    .max(5000, 'Höchstens 5000 Zeichen.'),
  city: z.string().trim().min(2, 'Bitte gib einen Ort ein.').max(100, 'Höchstens 100 Zeichen.'),
  categoryId: z.string().trim().min(1, 'Bitte wähle eine Kategorie aus.'),
  pricePerDay: priceFieldSchema,
  images: z
    .array(formImageSchema)
    .min(1, 'Bitte füge mindestens ein Foto hinzu.')
    .max(MAX_ITEM_IMAGES, 'Du kannst höchstens 8 Fotos hinzufügen.')
    .refine(
      (images) => new Set(images.map((image) => image.id)).size === images.length,
      'Ein Foto darf nur einmal hinzugefügt werden.',
    ),
});

// До проверки цена — текст из Input; после проверки — целое число центов.
export type ItemFormValues = z.input<typeof itemFormSchema>;
export type ValidatedItemForm = z.output<typeof itemFormSchema>;
export type FormImage = z.input<typeof formImageSchema>;

export const initialItemFormValues: ItemFormValues = {
  title: '',
  description: '',
  city: '',
  categoryId: '',
  pricePerDay: '',
  images: [],
};
