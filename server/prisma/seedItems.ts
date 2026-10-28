import type { PrismaClient } from '../src/generated/prisma/client.js';

export const DEMO_ITEM_ID = '30000000-0000-4000-8000-000000000001';

// Без явно выбранного владельца seed не создаёт объявление на случайный аккаунт.
export async function seedDemoItem(
  prisma: Pick<PrismaClient, 'user' | 'category' | 'item'>,
  ownerClerkId: string | undefined,
  itemId = DEMO_ITEM_ID,
): Promise<'skipped' | 'kept-other-owner' | 'ready'> {
  if (!ownerClerkId) return 'skipped';

  const owner = await prisma.user.findUniqueOrThrow({ where: { clerkUserId: ownerClerkId } });
  const category = await prisma.category.findUniqueOrThrow({ where: { name: 'Elektronik' } });
  const existing = await prisma.item.findUnique({ where: { id: itemId } });
  if (existing && existing.ownerId !== owner.id) return 'kept-other-owner';

  await prisma.item.upsert({
    where: { id: itemId },
    create: {
      id: itemId,
      ownerId: owner.id,
      categoryId: category.id,
      title: 'Beamer für einen Filmabend',
      description: 'Leichter Beamer mit HDMI-Anschluss. Ein HDMI-Kabel ist dabei.',
      city: owner.city.trim().length >= 2 ? owner.city : 'Berlin',
      pricePerDay: '15.50',
      // Фото добавим после подключения хранилища. До этого пример — черновик.
      isPublished: false,
    },
    // Повторный seed сохраняет пользовательские изменения и статус.
    update: {},
  });
  return 'ready';
}
