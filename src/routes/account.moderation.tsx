import { createFileRoute } from '@tanstack/react-router';
import { ModerationPage } from '../features/moderation/ModerationPage';

export const Route = createFileRoute('/account/moderation')({ component: ModerationPage });
