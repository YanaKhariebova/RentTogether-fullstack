import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/features/auth/api/useApi';
import type { Booking } from '../types/booking';

export function useIncomingBookingsQuery(enabled: boolean) {
  const api = useApi();
  return useQuery({ queryKey: ['bookings', 'incoming'], queryFn: () => api<{ bookings: Booking[] }>('/bookings/incoming'), enabled, retry: false });
}
