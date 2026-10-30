import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/features/auth/api/useApi';

export function useCancelBookingMutation() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/bookings/${id}/cancel`, { method: 'PATCH' }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['bookings', 'my-rentals'] }),
  });
}
