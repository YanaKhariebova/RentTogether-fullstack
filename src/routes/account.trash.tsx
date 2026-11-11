import { createFileRoute } from '@tanstack/react-router';
import { TrashPage } from '../features/moderation/TrashPage';

export const Route = createFileRoute('/account/trash')({ component: TrashPage });
