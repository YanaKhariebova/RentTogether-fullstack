import { createFileRoute } from '@tanstack/react-router';
import { OwnerItemsLayout } from '@/pages/items/OwnerItemsLayout';
export const Route = createFileRoute('/account/items')({ component: OwnerItemsLayout });
