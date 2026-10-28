// Общие публичные DTO берём из foundation, без второй копии контракта.
import type { Category, Item } from '@/shared/api/types';
export type PublicItem = Item;
export type ItemCategory = Category;
export type ItemImage = Item['images'][number];
export type ItemOwner = Item['owner'];
export interface OwnerItem extends PublicItem {
  createdAt: string;
  updatedAt: string;
}

export type { ItemsResponse, ItemResponse } from '@/shared/api/types';

// ownerId определяет сервер по авторизации, а не по данным формы.
// Фотографии загружаются отдельным запросом после создания черновика.
export interface CreateItemInput {
  title: string;
  description: string;
  city: string;
  categoryId: string;
  pricePerDay: string;
}

export interface UpdateItemInput extends Partial<CreateItemInput> {
  isPublished?: boolean;
}
