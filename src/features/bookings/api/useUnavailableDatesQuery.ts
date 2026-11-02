import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '@/shared/api/client';
import { apiKeys } from '@/shared/api/keys';

const api = createApiClient(async () => null);

export function useUnavailableDatesQuery(itemId: string) {
  return useQuery({
    queryKey: apiKeys.unavailableDates(itemId),
    queryFn: () =>
      api<{ ranges: { pickupDate: string; returnDate: string }[] }>(
        `/bookings/items/${itemId}/unavailable-dates`,
      ),
    enabled: Boolean(itemId),
    retry: false,
  });
}
