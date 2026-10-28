import { createFileRoute } from '@tanstack/react-router';
import { NewItemRoutePage } from '@/pages/items/NewItemRoutePage';
export const Route = createFileRoute('/account/items/new')({ component: NewItemRoutePage });
