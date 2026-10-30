import { useMutation } from '@tanstack/react-query';
import { useApi } from '@/features/auth/api/useApi';

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
  const api = useApi();
  return useMutation({
    mutationFn: (input: CreateBookingInput) =>
      api<BookingResponse>('/bookings', { method: 'POST', body: JSON.stringify(input) }),
    retry: false,
  });
}
