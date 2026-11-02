import { useAuth } from '@clerk/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/features/auth/api/useApi';
import { apiKeys } from '@/shared/api/keys';

export function useOwnerBookingStatusMutation() {
  const { userId } = useAuth();
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
    onSuccess: () =>
      void client.invalidateQueries({ queryKey: apiKeys.incomingBookings(userId ?? '') }),
  });
}
