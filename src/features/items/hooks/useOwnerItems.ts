// Основа последовательности запросов — прототип Яны (6b13365).
// Query-кеш изолирован по Clerk userId; сохранение фото вынесено в тестируемую сессию.
import { useRef } from 'react';
import { useAuth } from '@clerk/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/features/auth/api/useApi';
import { useCurrentUser } from '@/features/profile/api/useCurrentUser';
import { useCategoriesQuery } from '../api/useCategoriesQuery';
import { apiKeys } from '@/shared/api/keys';
import { ApiError } from '@/shared/api/client';
import { itemErrorMessage } from '../model/itemErrorMessage';
import { createOwnerItemSaveSession } from '../model/saveOwnerItem';
import type { OwnerItemsResponse, OwnerItemResponse } from '../types/item';
import type { ValidatedItemForm } from '../model/itemFormSchema';

export function useOwnerItems() {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const api = useApi();
  const client = useQueryClient();
  const sessions = useRef(new Map<string, ReturnType<typeof createOwnerItemSaveSession>>());
  const categories = useCategoriesQuery();
  const profile = useCurrentUser();
  const query = useQuery({
    queryKey: apiKeys.myItems(userId ?? ''),
    queryFn: ({ signal }) => api<OwnerItemsResponse>('/my/items', { signal }),
    enabled: isLoaded && !!isSignedIn,
    retry: (count, error) =>
      !(error instanceof ApiError && [401, 403].includes(error.status)) && count < 1,
  });
  async function refresh() {
    await Promise.all([
      client.invalidateQueries({ queryKey: apiKeys.myItems(userId ?? '') }),
      client.invalidateQueries({ queryKey: apiKeys.items }),
    ]);
  }
  const save = useMutation({
    mutationFn: async ({
      form,
      id,
      sessionKey,
    }: {
      form: ValidatedItemForm;
      id?: string;
      sessionKey: string;
    }) => {
      let session = sessions.current.get(sessionKey);
      if (!session) {
        session = createOwnerItemSaveSession(api, id);
        sessions.current.set(sessionKey, session);
      }
      try {
        const item = await session.save(form);
        sessions.current.delete(sessionKey);
        return item;
      } catch (error) {
        if (session.itemId) {
          const message = itemErrorMessage(error);
          throw new Error(
            `${message} Bereits gespeicherte Angaben und Fotos findest du unter „Meine Anzeigen“. Du kannst hier erneut speichern.`,
            { cause: error },
          );
        }
        throw error;
      }
    },
    retry: false,
    onSettled: refresh,
  });
  const publication = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      api<OwnerItemResponse>(`/items/${id}`, {
        method: published ? 'PATCH' : 'DELETE',
        ...(published ? { body: JSON.stringify({ isPublished: true }) } : {}),
      }),
    retry: false,
    onSettled: refresh,
  });
  return {
    items: query.data?.items ?? [],
    loadError: query.error ? itemErrorMessage(query.error) : null,
    status: query.isPending
      ? ('loading' as const)
      : query.isError
        ? ('error' as const)
        : ('ready' as const),
    categories: categories.data?.categories ?? [],
    categoriesStatus: categories.isPending
      ? ('loading' as const)
      : categories.isError
        ? ('error' as const)
        : ('ready' as const),
    defaultCity: profile.data?.user.city ?? '',
    busy: save.isPending || publication.isPending,
    retry() {
      void query.refetch();
    },
    retryCategories() {
      void categories.refetch();
    },
    async saveItem(form: ValidatedItemForm, id: string | undefined, sessionKey: string) {
      await save.mutateAsync({ form, id, sessionKey });
    },
    async unpublish(id: string) {
      await publication.mutateAsync({ id, published: false });
    },
    async publish(id: string) {
      await publication.mutateAsync({ id, published: true });
    },
  };
}
