import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/features/auth/api/useApi';
import { apiKeys } from '@/shared/api/keys';

export function useCancelBookingMutation() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; itemId: string }) =>
      api(`/bookings/${id}/cancel`, { method: 'PATCH' }),
    onSuccess: async (_response, input) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['bookings', 'my-rentals'] }),
        client.invalidateQueries({ queryKey: ['bookings', 'incoming'] }),
        client.invalidateQueries({ queryKey: apiKeys.unavailableDates(input.itemId) }),
      ]);
    },
  });
}
