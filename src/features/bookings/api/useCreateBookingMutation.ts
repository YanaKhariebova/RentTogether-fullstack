import { useAuth } from '@clerk/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/features/auth/api/useApi';
import { apiKeys } from '@/shared/api/keys';

type CreateBookingInput = {
  itemId: string;
  pickupDate: string;
  returnDate: string;
};

type BookingResponse = {
  booking: {
    id: string;
    status: string;
    totalPrice: string;
  };
};

export function useCreateBookingMutation() {
  const { userId } = useAuth();
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookingInput) =>
      api<BookingResponse>('/bookings', { method: 'POST', body: JSON.stringify(input) }),
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: apiKeys.myRentals(userId ?? '') }),
  });
}
