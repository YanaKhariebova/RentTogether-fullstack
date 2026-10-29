import type { PrismaClient } from '../../generated/prisma/client.js';
import type { ImageStorage } from './storage/ImageStorage.js';

type CleanupDatabase = Pick<PrismaClient, 'imageCleanup'>;

// Очередь переживает перезапуск API. Удаление объекта должно быть идемпотентным.
export async function flushImageCleanup(
  prisma: CleanupDatabase,
  storage: ImageStorage,
  key?: string,
) {
  const pending = await prisma.imageCleanup.findMany({
    where: key ? { storageKey: key } : undefined,
    orderBy: { createdAt: 'asc' },
    take: 50,
  });
  for (const job of pending) {
    try {
      await storage.delete(job.storageKey);
      await prisma.imageCleanup.deleteMany({ where: { storageKey: job.storageKey } });
    } catch {
      // Запись остаётся для следующей попытки. Не выводим провайдерские секреты в лог.
      console.warn('Image cleanup will be retried.');
    }
  }
}
