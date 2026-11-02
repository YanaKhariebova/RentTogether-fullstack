import { useAuth } from '@clerk/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/features/auth/api/useApi';
import { apiKeys } from '@/shared/api/keys';
import type { ItemCardData } from '@/features/catalog/types/item';

type FavoritesResponse = { items: ItemCardData[] };

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
  const key = apiKeys.favorites(userId ?? '');

  return useMutation({
    mutationFn: ({ item, isFavorite }: { item: ItemCardData; isFavorite: boolean }) =>
      api(`/me/favorites/${item.id}`, { method: isFavorite ? 'DELETE' : 'PUT' }),
    onSuccess: (_data, { item, isFavorite }) => {
      client.setQueryData<FavoritesResponse>(key, (current) => {
        if (!current) return current;
        if (isFavorite) return { items: current.items.filter((entry) => entry.id !== item.id) };
        if (current.items.some((entry) => entry.id === item.id)) return current;
        return { items: [item, ...current.items] };
      });
      void client.invalidateQueries({ queryKey: key });
    },
  });
}
