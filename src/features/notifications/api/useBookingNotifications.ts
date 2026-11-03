import { useAuth } from '@clerk/react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/features/auth/api/useApi';
import { ApiError } from '@/shared/api/client';
import { apiKeys } from '@/shared/api/keys';
import { parseNotificationsPage, parseNotificationCount } from '../model/notificationDto';

const pollInterval = 15_000;
function shouldPoll(error: Error | null) {
  return !(error instanceof ApiError && [401, 403, 404].includes(error.status));
}
export function useBookingNotificationCount() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const api = useApi();
  return useQuery({
    queryKey: apiKeys.notificationUnread(userId ?? ''),
    queryFn: async ({ signal }) =>
      parseNotificationCount(await api<unknown>('/me/notifications/unread-count', { signal })),
    enabled: isLoaded && !!isSignedIn,
    retry: false,
    refetchInterval: (query) => (shouldPoll(query.state.error) ? pollInterval : false),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}
export function useBookingNotifications() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const api = useApi();
  return useInfiniteQuery({
    queryKey: apiKeys.notificationList(userId ?? ''),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) => {
      const params = new URLSearchParams({ limit: '20' });
      if (pageParam) params.set('cursor', pageParam);
      return parseNotificationsPage(await api<unknown>(`/me/notifications?${params}`, { signal }));
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: isLoaded && !!isSignedIn,
    retry: false,
    refetchInterval: (query) => (shouldPoll(query.state.error) ? pollInterval : false),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}
export function useReadBookingNotification() {
  const { userId } = useAuth();
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const mutationUserId = userId ?? '';
      await api('/me/notifications/read', { method: 'PATCH', body: JSON.stringify({ ids }) });
      return mutationUserId;
    },
    onSuccess: (mutationUserId) =>
      client.invalidateQueries({ queryKey: apiKeys.notifications(mutationUserId) }),
    retry: false,
  });
}
