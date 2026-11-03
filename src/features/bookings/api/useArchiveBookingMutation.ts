import { useAuth } from '@clerk/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/features/auth/api/useApi';
import { apiKeys } from '@/shared/api/keys';

export function useArchiveBookingMutation() {
  const { userId } = useAuth();
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const actor = userId ?? '';
      await api('/bookings/' + id + '/history', { method: 'DELETE' });
      return actor;
    },
    onSuccess: async (actor) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: apiKeys.myRentals(actor) }),
        client.invalidateQueries({ queryKey: apiKeys.incomingBookings(actor) }),
        client.invalidateQueries({ queryKey: apiKeys.notifications(actor) }),
      ]);
    },
    retry: false,
  });
}
