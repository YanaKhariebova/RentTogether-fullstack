import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/features/auth/api/useApi';
import type { Booking } from '../types/booking';

export function useMyRentalsQuery(enabled: boolean) {
  const api = useApi();
  return useQuery({
    queryKey: ['bookings', 'my-rentals'],
    queryFn: () => api<{ bookings: Booking[] }>('/bookings/my-rentals'),
    enabled,
    retry: false,
  });
}
