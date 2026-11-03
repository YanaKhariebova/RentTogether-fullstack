import { createFileRoute } from '@tanstack/react-router';
import { ConversationPage } from '../features/messages/ConversationPage';

export const Route = createFileRoute('/account/messages/$conversationId')({
  component: ConversationPage,
});
