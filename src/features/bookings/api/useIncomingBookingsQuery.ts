import { useAuth } from '@clerk/react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/features/auth/api/useApi';
import { apiKeys } from '@/shared/api/keys';
import type { Booking } from '../types/booking';

export function useIncomingBookingsQuery(enabled: boolean) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const api = useApi();
  return useQuery({
    queryKey: apiKeys.incomingBookings(userId ?? ''),
    queryFn: () => api<{ bookings: Booking[] }>('/bookings/incoming'),
    enabled: enabled && isLoaded && !!isSignedIn,
    retry: false,
  });
}
