import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/features/auth/api/useApi';

export function useOwnerBookingStatusMutation() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED';
    }) => api(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['bookings', 'incoming'] }),
  });
}
