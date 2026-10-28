import { createPrisma } from '../src/lib/prisma.js';
import { seedDemoItem } from './seedItems.js';

const prisma = createPrisma();
try {
  for (const [id, name] of [
    ['10000000-0000-4000-8000-000000000001', 'Elektronik'],
    ['10000000-0000-4000-8000-000000000002', 'Werkzeug'],
    ['10000000-0000-4000-8000-000000000003', 'Sport & Freizeit'],
    ['10000000-0000-4000-8000-000000000004', 'Haushalt & Garten'],
  ]) {
    await prisma.category.upsert({ where: { name }, create: { id, name }, update: {} });
  }
  for (const [clerkUserId, name] of [
    [process.env.SEED_OWNER_CLERK_ID, 'Olga'],
    [process.env.SEED_RENTER_CLERK_ID, 'Jana'],
  ]) {
    if (clerkUserId)
      await prisma.user.upsert({
        where: { clerkUserId },
        create: { clerkUserId, name: name!, city: 'Berlin', email: '' },
        update: {},
      });
  }
  const itemStatus = await seedDemoItem(prisma, process.env.SEED_OWNER_CLERK_ID);
  if (itemStatus === 'skipped') {
    console.log('Demo item skipped: set SEED_OWNER_CLERK_ID to select its owner.');
  } else if (itemStatus === 'kept-other-owner') {
    console.log('Existing demo item kept with its original owner.');
  } else {
    console.log('Demo item ready. Existing edits are preserved.');
  }
  console.log('Categories and configured demo users seeded.');
} finally {
  await prisma.$disconnect();
}
