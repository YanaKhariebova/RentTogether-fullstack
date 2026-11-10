import { useMutation } from '@tanstack/react-query';
import { useApi } from '@/features/auth/api/useApi';

export type ItemReportReason =
  | 'Unangemessener Inhalt'
  | 'Betrug oder verdächtiges Angebot'
  | 'Verbotener Artikel'
  | 'Falsche Angaben'
  | 'Anderer Grund';

export function useReportItemMutation(itemId: string) {
  const api = useApi();
  return useMutation({
    mutationFn: ({ reason, details }: { reason: ItemReportReason; details: string }) =>
      api(`/items/${itemId}/reports`, {
        method: 'POST',
        body: JSON.stringify({ reason, details }),
      }),
    retry: false,
  });
}
