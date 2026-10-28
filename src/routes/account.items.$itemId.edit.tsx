import { createFileRoute } from '@tanstack/react-router';
import { EditItemRoutePage } from '@/pages/items/EditItemRoutePage';
export const Route = createFileRoute('/account/items/$itemId/edit')({
  component: EditItemRoutePage,
});
