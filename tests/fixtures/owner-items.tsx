// Изолированный стенд, не импортируется приложением. Не является обходом auth в production.
import { createRoot } from 'react-dom/client';
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
  Outlet,
  useLocation,
} from '@tanstack/react-router';
import '@fontsource-variable/inter';
import '../../src/index.css';
import styles from './owner-items.module.css';
import { OwnerItemsProvider } from '../../src/features/items/components/OwnerItemsProvider';
import { OwnerItemsWorkspace } from '../../src/pages/items/OwnerItemsWorkspace';
import { NewItemRoutePage } from '../../src/pages/items/NewItemRoutePage';
import { EditItemRoutePage } from '../../src/pages/items/EditItemRoutePage';
export function TestRoot() {
  const location = useLocation();
  return (
    <main className={styles.main}>
      <output aria-label="Aktuelle Route">{location.pathname}</output>
      <OwnerItemsProvider>
        <Outlet />
      </OwnerItemsProvider>
    </main>
  );
}
const root = createRootRoute({ component: TestRoot });
const list = createRoute({
  getParentRoute: () => root,
  path: '/account/items',
  component: OwnerItemsWorkspace,
});
const create = createRoute({
  getParentRoute: () => root,
  path: '/account/items/new',
  component: NewItemRoutePage,
});
const edit = createRoute({
  getParentRoute: () => root,
  path: '/account/items/$itemId/edit',
  component: EditItemRoutePage,
});
const router = createRouter({
  routeTree: root.addChildren([list, create, edit]),
  history: createMemoryHistory({ initialEntries: ['/account/items'] }),
});
createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
