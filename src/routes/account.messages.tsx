import { createFileRoute } from '@tanstack/react-router';
import { MessagesPage } from '../features/messages/MessagesPage';

export const Route = createFileRoute('/account/messages')({ component: MessagesPage });
