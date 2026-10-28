import { useAuth } from '@clerk/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../../../shared/api/client';
import type { MeResponse, ProfilePatch } from '../../../shared/api/types';
import { useApi } from '../../auth/api/useApi';

export const currentUserKey = (clerkUserId: string | null | undefined) =>
  ['me', clerkUserId] as const;

export function useCurrentUser() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const api = useApi();
  return useQuery({
    queryKey: currentUserKey(userId),
    queryFn: ({ signal }) => api<MeResponse>('/me', { signal }),
    enabled: isLoaded && !!isSignedIn,
    retry: (count, error) => !(error instanceof ApiError && error.status === 401) && count < 1,
  });
}

export function useUpdateProfile() {
  const { userId } = useAuth();
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfilePatch) =>
      api<MeResponse>('/me', { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: (data) => {
      client.setQueryData(currentUserKey(userId), data);
    },
  });
}
