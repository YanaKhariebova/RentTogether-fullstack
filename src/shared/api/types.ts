export type Category = { id: string; name: string };
export type CurrentUser = {
  id: string;
  name: string;
  city: string;
  email: string;
  phone: string;
  avatarUrl: string;
};
export type ProfilePatch = Partial<Pick<CurrentUser, 'name' | 'city' | 'phone'>>;
export type Item = {
  id: string;
  title: string;
  description: string;
  pricePerDay: string;
  city: string;
  category: Category;
  images: { id: string; url: string; order: number }[];
  owner: Pick<CurrentUser, 'id' | 'name' | 'city'>;
  isPublished: boolean;
};
export type ItemsQuery = {
  q?: string;
  city?: string;
  categoryId?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: number;
  limit?: number;
};
export type Pagination = { page: number; limit: number; total: number; totalPages: number };
export type ItemsResponse = { items: Item[]; pagination: Pagination };
export type ItemResponse = { item: Item };
export type MeResponse = { user: CurrentUser };
export type CategoriesResponse = { categories: Category[] };
export type ApiErrorBody = {
  error: { code: string; message: string; fields: Record<string, string[]> };
};
