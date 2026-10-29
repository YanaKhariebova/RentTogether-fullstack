import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '@/shared/api/client';
import { apiKeys } from '@/shared/api/keys';
import type { ItemResponse } from '@/shared/api/types';

const publicApi = createApiClient(async () => null);

export function useItemDetailQuery(itemId: string) {
  return useQuery({
    queryKey: apiKeys.item(itemId),
    queryFn: ({ signal }) => publicApi<ItemResponse>(`/items/${itemId}`, { signal }),
    enabled: Boolean(itemId),
    retry: false,
  });
}
