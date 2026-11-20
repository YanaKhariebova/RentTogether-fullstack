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
import { ConversationPage } from '../../src/features/messages/ConversationPage';
import '../../src/index.css';

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
    <button onClick={() => void client.invalidateQueries({ queryKey: ['conversations'] })}>
      Test refresh
    </button>
    <RouterProvider router={router} />
  </QueryClientProvider>,
);
