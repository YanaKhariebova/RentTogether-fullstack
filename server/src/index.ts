import 'dotenv/config';
import { clerkClient, clerkMiddleware, getAuth } from '@clerk/express';
import { createApp } from './app.js';
import { createPrisma } from './lib/prisma.js';
import { createRequireAuth } from './middleware/requireAuth.js';
import { syncUser } from './modules/users/syncUser.js';
import { configureImageStorage } from './modules/items/storage/configureImageStorage.js';
import { flushImageCleanup } from './modules/items/imageCleanup.js';

for (const key of ['DATABASE_URL', 'CLERK_SECRET_KEY', 'CLERK_PUBLISHABLE_KEY']) {
  if (!process.env[key]) throw new Error(`${key} is required. See server/.env.example.`);
}
const prisma = createPrisma();
const authenticate = createRequireAuth({
  getSubject: (req) => getAuth(req).userId,
  loadIdentity: async (clerkUserId) => {
    const user = await clerkClient.users.getUser(clerkUserId);
    return {
      clerkUserId,
      name:
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Mitglied',
      email:
        user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)
          ?.emailAddress ?? '',
    };
  },
  syncUser: (identity) => syncUser(prisma, identity),
});
const port = Number(process.env.PORT ?? 3000);
const { provider, imageStorage, localUploadsDirectory } = configureImageStorage(process.env);
let cleanupRunning = false;
async function runImageCleanup() {
  if (cleanupRunning) return;
  cleanupRunning = true;
  try {
    await flushImageCleanup(prisma, imageStorage);
  } catch {
    console.warn('Image cleanup is temporarily unavailable.');
  } finally {
    cleanupRunning = false;
  }
}
void runImageCleanup();
const cleanupTimer = setInterval(() => {
  void runImageCleanup();
}, 30_000);
cleanupTimer.unref();
const app = createApp({
  imageStorage,
  localUploadsDirectory,
  prisma,
  authenticate,
  authMiddleware: clerkMiddleware({
    authorizedParties: [process.env.CLIENT_URL ?? 'http://localhost:5173'],
  }),
  clientUrl: process.env.CLIENT_URL,
});
const server = app.listen(port, () =>
  console.log(`RentTogether API runs at http://localhost:${port} (image storage: ${provider})`),
);
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    clearInterval(cleanupTimer);
    server.close(() => {
      void prisma.$disconnect().then(() => process.exit(0));
    });
  });
}
