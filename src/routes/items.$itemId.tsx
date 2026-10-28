import { createFileRoute } from '@tanstack/react-router';
import { ItemDetailPage } from '../features/catalog/ItemDetailPage';

export const Route = createFileRoute('/items/$itemId')({
  component: ItemDetailPage,
});
