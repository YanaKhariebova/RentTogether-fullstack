import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AppHeader } from '../app/AppHeader';
import { PageLayout } from '../shared/ui/templates/PageLayout/PageLayout';
import { NotFoundPage } from '../pages/NotFoundPage';
export const Route = createRootRoute({
  component: () => (
    <PageLayout header={<AppHeader />}>
      <Outlet />
    </PageLayout>
  ),
  notFoundComponent: NotFoundPage,
});
