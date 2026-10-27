import { itemImageFileSchema, MAX_ITEM_IMAGES } from "./itemFormSchema.ts";

export function validateImageSelection(files: File[], existingCount: number) {
  const accepted: File[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const result = itemImageFileSchema.safeParse(file);
    if (!result.success) {
      errors.push(`${file.name}: ${result.error.issues[0].message}`);
    } else if (existingCount + accepted.length >= MAX_ITEM_IMAGES) {
      errors.push(`${file.name}: Du kannst höchstens ${MAX_ITEM_IMAGES} Fotos hinzufügen.`);
    } else {
      accepted.push(file);
    }
  }

  return { accepted, errors };
}

export function moveImage<T extends { id: string }>(images: T[], id: string, direction: -1 | 1): T[] {
  const index = images.findIndex((image) => image.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= images.length) return images;
  const next = [...images];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
