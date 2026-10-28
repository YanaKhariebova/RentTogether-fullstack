import { z } from 'zod';
import type { User } from '../../generated/prisma/client.js';

z.config(z.locales.de());

export const profilePatchSchema = z
  .strictObject({
    name: z.string().trim().min(1, 'Bitte gib deinen Namen ein.').max(100),
    city: z.string().trim().max(100),
    phone: z.string().trim().max(50),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Bitte ändere mindestens ein Feld.');

export function toCurrentUser(user: User) {
  return { id: user.id, name: user.name, city: user.city, email: user.email, phone: user.phone };
}
