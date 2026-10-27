// Публичный контракт согласован с Яной. Цена в API — строка EUR: "15.50".
export interface ItemImage {
  id: string;
  url: string;
  order: number;
}

export interface ItemCategory {
  id: string;
  name: string;
}

export interface ItemOwner {
  id: string;
  name: string;
  city: string;
}

export interface PublicItem {
  id: string;
  title: string;
  description: string;
  city: string;
  category: ItemCategory;
  pricePerDay: string;
  owner: ItemOwner;
  isPublished: boolean;
  images: ItemImage[];
}

export interface OwnerItem extends PublicItem {
  createdAt: string;
  updatedAt: string;
}

export interface ItemsResponse {
  items: PublicItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ItemResponse {
  item: PublicItem;
}

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
