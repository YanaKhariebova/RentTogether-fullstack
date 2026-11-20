import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AppHeader } from '../app/AppHeader';
import { PageLayout } from '../shared/ui/templates/PageLayout/PageLayout';
import { MessageRealtimeProvider } from '../features/messages/api/MessageRealtimeProvider';
import { NotFoundPage } from '../pages/NotFoundPage';
export const Route = createRootRoute({
  component: () => (
    <MessageRealtimeProvider>
      <PageLayout header={<AppHeader />}>
        <Outlet />
      </PageLayout>
    </MessageRealtimeProvider>
  ),
  notFoundComponent: NotFoundPage,
});
