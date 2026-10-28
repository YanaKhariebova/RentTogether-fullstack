import { createFileRoute, Outlet } from '@tanstack/react-router';
import { RequireAuth } from '../features/auth/RequireAuth';
export const Route = createFileRoute('/account')({
  component: () => (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  ),
});
