import { createRootRoute, Outlet } from '@tanstack/react-router';
import { PageLayout } from '../shared/ui/templates/PageLayout/PageLayout';
import { NotFoundPage } from '../pages/NotFoundPage';
export const Route = createRootRoute({
  component: () => (
    <PageLayout>
      <Outlet />
    </PageLayout>
  ),
  notFoundComponent: NotFoundPage,
});
