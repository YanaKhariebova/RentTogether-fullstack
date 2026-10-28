import type { PrismaClient } from '../../generated/prisma/client.js';
import type { Identity } from '../../middleware/requireAuth.js';

export function syncUser(
  prisma: Pick<PrismaClient, 'user'>,
  { clerkUserId, name, email }: Identity,
) {
  return prisma.user.upsert({
    where: { clerkUserId },
    create: { clerkUserId, name, email },
    update: { email },
  });
}
