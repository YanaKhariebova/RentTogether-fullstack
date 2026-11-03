import type { PrismaClient } from '../src/generated/prisma/client.js';

// Stable IDs: existing items keep their category references.
export const rentalCategories = [
  { id: '10000000-0000-4000-8000-000000000001', name: 'Elektronik' },
  { id: '10000000-0000-4000-8000-000000000002', name: 'Werkzeug' },
  { id: '10000000-0000-4000-8000-000000000003', name: 'Sport & Freizeit' },
  { id: '10000000-0000-4000-8000-000000000004', name: 'Haushalt & Garten' },
  { id: '10000000-0000-4000-8000-000000000005', name: 'Foto & Video' },
  { id: '10000000-0000-4000-8000-000000000006', name: 'Musikinstrumente & Tontechnik' },
  { id: '10000000-0000-4000-8000-000000000007', name: 'Party & Veranstaltungen' },
  { id: '10000000-0000-4000-8000-000000000008', name: 'Camping & Outdoor' },
  { id: '10000000-0000-4000-8000-000000000009', name: 'Fahrräder & Zubehör' },
  { id: '10000000-0000-4000-8000-000000000010', name: 'Autozubehör & Anhänger' },
  { id: '10000000-0000-4000-8000-000000000011', name: 'Baby & Kinder' },
  { id: '10000000-0000-4000-8000-000000000012', name: 'Spielzeug & Gesellschaftsspiele' },
  { id: '10000000-0000-4000-8000-000000000013', name: 'Kleidung & Kostüme' },
  { id: '10000000-0000-4000-8000-000000000014', name: 'Möbel & Einrichtung' },
  { id: '10000000-0000-4000-8000-000000000015', name: 'Umzug & Transport' },
  { id: '10000000-0000-4000-8000-000000000016', name: 'Reinigung & Pflege' },
  { id: '10000000-0000-4000-8000-000000000017', name: 'Küche & Gastronomie' },
  { id: '10000000-0000-4000-8000-000000000018', name: 'Heimwerken & Renovieren' },
  { id: '10000000-0000-4000-8000-000000000019', name: 'Nähen & Handarbeiten' },
  { id: '10000000-0000-4000-8000-000000000020', name: 'Kunst & Kreativbedarf' },
  { id: '10000000-0000-4000-8000-000000000021', name: 'Bücher & Lernmaterial' },
  { id: '10000000-0000-4000-8000-000000000022', name: 'Gesundheit & Wellness' },
  { id: '10000000-0000-4000-8000-000000000023', name: 'Büro & Präsentation' },
  { id: '10000000-0000-4000-8000-000000000024', name: 'Tierbedarf' },
  { id: '10000000-0000-4000-8000-000000000025', name: 'Reisegepäck & Zubehör' },
  { id: '10000000-0000-4000-8000-000000000026', name: 'Saisonartikel & Dekoration' },
  { id: '10000000-0000-4000-8000-000000000027', name: 'Sonstiges' },
] as const;

export async function seedCategories(prisma: Pick<PrismaClient, 'category'>) {
  for (const { id, name } of rentalCategories) {
    await prisma.category.upsert({ where: { name }, create: { id, name }, update: {} });
  }
}
