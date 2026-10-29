import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '@/shared/api/client';
import { apiKeys } from '@/shared/api/keys';
import type { ItemsQuery, ItemsResponse } from '@/shared/api/types';

const publicApi = createApiClient(async () => null);

function toQueryString(query: ItemsQuery) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }

  return params.toString();
}

export function useCatalogItemsQuery(query: ItemsQuery, enabled = true) {
  const queryString = toQueryString(query);
  const path = queryString ? `/items?${queryString}` : '/items';

  return useQuery({
    queryKey: apiKeys.itemList(query),
    enabled,
    queryFn: ({ signal }) => publicApi<ItemsResponse>(path, { signal }),
  });
}
