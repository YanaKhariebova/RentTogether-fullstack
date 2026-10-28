import type { ItemCategory, OwnerItem } from '../types/item';

// Только для разработки интерфейса. Это не seed и не реальные данные API.
export const mockCategories: ItemCategory[] = [
  { id: 'mock-electronics', name: 'Elektronik' },
  { id: 'mock-tools', name: 'Werkzeug' },
  { id: 'mock-outdoor', name: 'Freizeit & Outdoor' },
];

export const mockOwnerItems: OwnerItem[] = [
  {
    id: 'mock-projector',
    owner: { id: 'mock-olga', name: 'Olga', city: 'Berlin' },
    title: 'Beamer für einen Filmabend',
    description: 'Leichter Beamer mit HDMI-Anschluss. Ein HDMI-Kabel ist dabei.',
    city: 'Berlin',
    category: mockCategories[0],
    pricePerDay: '15.00',
    isPublished: false,
    images: [],
    createdAt: '2026-10-27T12:00:00.000Z',
    updatedAt: '2026-10-27T12:00:00.000Z',
  },
];
