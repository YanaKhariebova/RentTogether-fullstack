// Изолированный стенд, не импортируется приложением. Не является обходом auth в production.
import { useState } from 'react';
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
import workspaceStyles from '../../src/pages/items/OwnerItemsWorkspace.module.css';
import { OwnerItemsContext } from '../../src/features/items/model/OwnerItemsContext';
import { useMockOwnerItems } from '../../src/features/items/hooks/useMockOwnerItems';
import { mockCategories, mockOwnerItems } from '../../src/features/items/mocks/items';
import { ThemeToggle } from '../../src/features/theme/ThemeToggle';
const fixtureState = new URLSearchParams(window.location.search).get('state');
const favoriteFixture = new URLSearchParams(window.location.search).get('favorite');
let loadAttempts = 0;
async function loadFixtureItems() {
  if (fixtureState === 'loading') return new Promise<typeof mockOwnerItems>(() => {});
  if (fixtureState === 'error' && loadAttempts++ === 0) throw new Error('Fixture load error');
  if (fixtureState === 'empty') return [];
  const items = structuredClone(mockOwnerItems);
  return fixtureState === 'published'
    ? items.map((item) => ({
        ...item,
        isPublished: true,
        images: [{ id: 'fixture-photo', url: '/media/hero-mobile-640.webp', order: 0 }],
      }))
    : items;
}
function MockOwnerItemsProvider({ children }: { children: React.ReactNode }) {
  const store = useMockOwnerItems(loadFixtureItems);
  const [notice, setNotice] = useState('');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  return (
    <OwnerItemsContext.Provider
      value={{
        ...store,
        items: store.items.map((item) =>
          favoriteFixture
            ? {
                ...item,
                isPublished: true,
                isFavorite: favorites[item.id] ?? false,
              }
            : item,
        ),
        setFavorite: favoriteFixture
          ? async (id, isFavorite) => {
              await new Promise((resolve) => setTimeout(resolve, 200));
              if (favoriteFixture === 'error')
                throw new Error('Favoriten konnten nicht gespeichert werden.');
              setFavorites((current) => ({ ...current, [id]: isFavorite }));
            }
          : undefined,
        notice,
        setNotice,
        categories: mockCategories,
        categoriesStatus: 'ready',
        defaultCity: '',
        busy: false,
        retryCategories() {},
      }}
    >
      {children}
    </OwnerItemsContext.Provider>
  );
}
import { OwnerItemsWorkspace } from '../../src/pages/items/OwnerItemsWorkspace';
import { NewItemRoutePage } from '../../src/pages/items/NewItemRoutePage';
import { EditItemRoutePage } from '../../src/pages/items/EditItemRoutePage';
export function TestRoot() {
  const location = useLocation();
  return (
    <main className={styles.main}>
      <ThemeToggle />
      <output aria-label="Aktuelle Route">{location.pathname}</output>
      <MockOwnerItemsProvider>
        <section className={workspaceStyles.workspace}>
          <Outlet />
        </section>
      </MockOwnerItemsProvider>
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
