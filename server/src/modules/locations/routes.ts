import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../../lib/errors.js';
import type { LocationService } from './service.js';

export function createLocationRoutes(service: LocationService) {
  const router = Router();
  const requests = new Map<string, { count: number; until: number }>();
  router.get('/', async (req, res) => {
    const { q } = z.strictObject({ q: z.string().trim().min(2).max(100) }).parse(req.query);
    const now = Date.now();
    for (const [key, entry] of requests) if (entry.until <= now) requests.delete(key);
    const key = req.ip ?? 'unknown';
    const entry = requests.get(key) ?? { count: 0, until: now + 60_000 };
    if (entry.count >= 60 || (!requests.has(key) && requests.size >= 1000))
      throw new ApiError(429, 'LOCATION_RATE_LIMIT', 'Bitte warte kurz und suche erneut.');
    entry.count++;
    requests.set(key, entry);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json({ places: await service.search(q) });
  });
  return router;
}
