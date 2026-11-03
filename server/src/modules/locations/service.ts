import { z } from 'zod';
import { ApiError } from '../../lib/errors.js';

const localitySchema = z.object({
  name: z.string().min(2).max(100),
  postalCode: z.string().regex(/^\d{5}$/),
  municipality: z.object({ key: z.string() }).optional(),
  federalState: z.object({ key: z.string(), name: z.string() }),
});
export type Place = {
  id: string;
  name: string;
  region: string;
  country: string;
  countryCode: string;
  postcodes: string[];
};
export type LocationService = {
  search: (query: string) => Promise<Place[]>;
  normalize: (city: string) => Promise<string>;
};
const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('de')
    .replaceAll('ß', 'ss')
    .trim();

// OpenPLZ uses POSIX BRE: escape its metacharacters, never accept a user's regex.
// The small character classes also find Köln when a user types Koln.
function literalPattern(value: string) {
  return [...value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('de')]
    .map(
      (char) =>
        ({ a: '[aä]', o: '[oö]', u: '[uü]' })[char] ??
        (/[.\\[\]*^$]/.test(char) ? '\\' + char : char),
    )
    .join('');
}
export function createLocationService(request: typeof fetch = fetch): LocationService {
  const cache = new Map<string, { until: number; places: Place[] }>();
  const pending = new Map<string, Promise<Place[]>>();
  async function lookup(query: string, exact = false): Promise<Place[]> {
    const text = query.trim();
    if (text.length < 2) return [];
    const key = (exact ? 'exact:' : 'search:') + fold(text);
    const saved = cache.get(key);
    if (saved && saved.until > Date.now()) return saved.places;
    const existing = pending.get(key);
    if (existing) return existing;
    if (pending.size >= 60)
      throw new ApiError(429, 'LOCATION_RATE_LIMIT', 'Bitte versuche die Ortssuche gleich erneut.');
    const job = (async () => {
      try {
        const url = new URL('https://openplzapi.org/de/Localities');
        const postal = /^\d+$/.test(text);
        url.search = new URLSearchParams({
          [postal ? 'postalCode' : 'name']:
            '^' + literalPattern(text) + (exact || (text.length === 5 && postal) ? '$' : ''),
          page: '1',
          pageSize: '50',
        }).toString();
        const response = await request(url, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) throw new Error('Location provider unavailable');
        const rows = z.array(localitySchema).parse(await response.json());
        const grouped = new Map<string, Place>();
        for (const row of rows) {
          const id = (row.municipality?.key ?? row.federalState.key) + ':' + row.name;
          const current = grouped.get(id);
          if (current) {
            if (!current.postcodes.includes(row.postalCode)) current.postcodes.push(row.postalCode);
          } else
            grouped.set(id, {
              id,
              name: row.name,
              region: row.federalState.name,
              country: 'Deutschland',
              countryCode: 'DE',
              postcodes: [row.postalCode],
            });
        }
        const places = [...grouped.values()].slice(0, 10);
        if (cache.size >= 300) cache.delete(cache.keys().next().value!);
        cache.set(key, { until: Date.now() + 600_000, places });
        return places;
      } catch {
        throw new ApiError(
          503,
          'LOCATION_SERVICE_UNAVAILABLE',
          'Die Ortssuche ist gerade nicht erreichbar. Bitte versuche es erneut.',
        );
      }
    })();
    pending.set(key, job);
    try {
      return await job;
    } finally {
      pending.delete(key);
    }
  }
  return {
    search: (query) => lookup(query),
    async normalize(city) {
      const match = (await lookup(city, true)).find((place) => fold(place.name) === fold(city));
      if (!match)
        throw new ApiError(
          422,
          'CITY_NOT_FOUND',
          'Bitte wähle einen gültigen Ort aus den Suchvorschlägen.',
          { city: ['Bitte suche nach Ortsname oder Postleitzahl und wähle einen Ort aus.'] },
        );
      return match.name;
    },
  };
}
