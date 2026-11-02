import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '@/shared/api/client';

const api = createApiClient(async () => null);

export function useUnavailableDatesQuery(itemId: string) {
  return useQuery({
    queryKey: ['bookings', 'unavailable-dates', itemId],
    queryFn: () =>
      api<{ ranges: { pickupDate: string; returnDate: string }[] }>(
        `/bookings/items/${itemId}/unavailable-dates`,
      ),
    enabled: Boolean(itemId),
    retry: false,
  });
}
