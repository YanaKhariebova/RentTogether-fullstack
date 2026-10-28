import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '../../../shared/api/client';
import { apiKeys } from '../../../shared/api/keys';
import type { CategoriesResponse } from '../../../shared/api/types';
const publicApi = createApiClient(async () => null);
export function useCategoriesQuery() {
  return useQuery({
    queryKey: apiKeys.categories,
    queryFn: ({ signal }) => publicApi<CategoriesResponse>('/categories', { signal }),
  });
}
