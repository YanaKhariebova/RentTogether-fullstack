import type { ItemsQuery } from './types';
export const apiKeys = {
  categories: ['categories'] as const,
  items: ['items'] as const,
  catalogCities: ['items', 'cities'] as const,
  itemList: (query: ItemsQuery) => ['items', 'list', query] as const,
  item: (id: string) => ['items', 'detail', id] as const,
  myItems: (userId: string) => ['my-items', userId] as const,
  myRentals: (userId: string) => ['bookings', 'my-rentals', userId] as const,
  incomingBookings: (userId: string) => ['bookings', 'incoming', userId] as const,
};
