// Exercise the production page and query hooks with a local, isolated identity.
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { MessageRealtimeProvider } from '../../src/features/messages/api/MessageRealtimeProvider';
import { useMessageUnreadCount } from '../../src/features/messages/api/useConversations';
import { useMessageNotificationSound } from '../../src/features/messages/api/useMessageNotificationSound';
import { useMessageRealtimeState } from '../../src/features/messages/api/realtimeContext';
import { ConversationPage } from '../../src/features/messages/ConversationPage';
import '../../src/index.css';

export function MessageUpdates() {
  const count = useMessageUnreadCount();
  const { connected } = useMessageRealtimeState();
  useMessageNotificationSound(count.data?.count);
  return <output aria-label="Chat connection">{connected ? 'connected' : 'disconnected'}</output>;
}

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const root = createRootRoute();
const route = createRoute({
  getParentRoute: () => root,
  path: '/account/messages/$conversationId',
  component: ConversationPage,
});
const router = createRouter({
  routeTree: root.addChildren([route]),
  history: createMemoryHistory({ initialEntries: ['/account/messages/test-conversation'] }),
});
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={client}>
    <MessageRealtimeProvider>
      <MessageUpdates />
      <button onClick={() => void client.invalidateQueries({ queryKey: ['conversations'] })}>
        Test refresh
      </button>
      <RouterProvider router={router} />
    </MessageRealtimeProvider>
  </QueryClientProvider>,
);
