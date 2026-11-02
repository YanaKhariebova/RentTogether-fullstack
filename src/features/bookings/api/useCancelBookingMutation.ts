import { useAuth } from '@clerk/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/features/auth/api/useApi';
import { apiKeys } from '@/shared/api/keys';

export function useCancelBookingMutation() {
  const { userId } = useAuth();
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/bookings/${id}/cancel`, { method: 'PATCH' }),
    onSuccess: () => void client.invalidateQueries({ queryKey: apiKeys.myRentals(userId ?? '') }),
  });
}
