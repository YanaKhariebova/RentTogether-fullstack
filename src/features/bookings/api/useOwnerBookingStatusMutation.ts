import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/features/auth/api/useApi';
import { apiKeys } from '@/shared/api/keys';

export function useOwnerBookingStatusMutation() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      itemId: string;
      status: 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED';
    }) => api(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: async (_response, input) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['bookings', 'my-rentals'] }),
        client.invalidateQueries({ queryKey: ['bookings', 'incoming'] }),
        client.invalidateQueries({ queryKey: apiKeys.unavailableDates(input.itemId) }),
      ]);
    },
  });
}
