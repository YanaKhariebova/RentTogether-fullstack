import { useAuth } from '@clerk/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/features/auth/api/useApi';
import { apiKeys } from '@/shared/api/keys';
import type { OwnerItemsResponse } from '@/features/items/types/item';
import type { ItemCardData } from '@/features/catalog/types/item';

export type FavoritesResponse = { items: ItemCardData[] };

export function useFavoritesQuery() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const api = useApi();
  return useQuery({
    queryKey: apiKeys.favorites(userId ?? ''),
    queryFn: () => api<FavoritesResponse>('/me/favorites'),
    enabled: isLoaded && !!isSignedIn,
    retry: false,
  });
}

export function useFavoriteMutation() {
  const { userId } = useAuth();
  const api = useApi();
  const client = useQueryClient();

  return useMutation({
    mutationFn: async ({ item, isFavorite }: { item: ItemCardData; isFavorite: boolean }) => {
      // Capture the account before awaiting: switching accounts must not patch its cache.
      const mutationUserId = userId ?? '';
      await api(`/me/favorites/${item.id}`, { method: isFavorite ? 'DELETE' : 'PUT' });
      return { mutationUserId };
    },
    retry: false,
    onSuccess: ({ mutationUserId }, { item, isFavorite }) => {
      const mutationKey = apiKeys.favorites(mutationUserId);
      client.setQueryData<FavoritesResponse>(mutationKey, (current) => {
        if (!current) return current;
        if (isFavorite) return { items: current.items.filter((entry) => entry.id !== item.id) };
        if (current.items.some((entry) => entry.id === item.id)) return current;
        return { items: [item, ...current.items] };
      });
      client.setQueryData<OwnerItemsResponse>(apiKeys.myItems(mutationUserId), (current) =>
        current
          ? {
              ...current,
              items: current.items.map((entry) =>
                entry.id === item.id ? { ...entry, isFavorite: !isFavorite } : entry,
              ),
            }
          : current,
      );
      return Promise.all([
        client.invalidateQueries({ queryKey: mutationKey }),
        client.invalidateQueries({ queryKey: apiKeys.myItems(mutationUserId) }),
      ]);
    },
  });
}
