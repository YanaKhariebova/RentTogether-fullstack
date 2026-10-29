import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '@/shared/api/client';
import { apiKeys } from '@/shared/api/keys';
const publicApi = createApiClient(async () => null);
export function useCatalogCitiesQuery() {
  return useQuery({
    queryKey: apiKeys.catalogCities,
    queryFn: ({ signal }) => publicApi<{ cities: string[] }>('/items/cities', { signal }),
  });
}
