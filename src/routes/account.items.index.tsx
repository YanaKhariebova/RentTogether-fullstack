import { createFileRoute } from '@tanstack/react-router';
import { OwnerItemsWorkspace } from '@/pages/items/OwnerItemsWorkspace';
export const Route = createFileRoute('/account/items/')({ component: OwnerItemsWorkspace });
