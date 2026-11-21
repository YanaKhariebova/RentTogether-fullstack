import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { translate as t } from '../../src/i18n/config';
import { NavigationIcon } from '../../src/shared/ui/organisms/Header/NavigationIcon';
import headerStyles from '../../src/shared/ui/organisms/Header/Header.module.css';
import { useAuth } from '@clerk/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
  Link,
} from '@tanstack/react-router';
import { HeaderView } from '../../src/shared/ui/organisms/Header/Header';
import { LanguageProvider } from '../../src/i18n/LanguageProvider';
import { LanguagePicker } from '../../src/i18n/LanguagePicker';
import { initializeLanguage } from '../../src/i18n/config';
import { HomePage } from '../../src/pages/HomePage';
import { ProfilePage } from '../../src/features/profile/ProfilePage';
import { CatalogPage } from '../../src/features/catalog/CatalogPage';
import { ThemeToggle } from '../../src/features/theme/ThemeToggle';
import '@fontsource-variable/inter';
import '../../src/index.css';
export function LanguageTestRoot() {
  useTranslation();
  const { isSignedIn } = useAuth();
  const [draft, setDraft] = useState('');
  return (
    <>
      <HeaderView
        signedIn={isSignedIn}
        auth={
          <Link to="/account/profile" className={headerStyles.signInLink}>
            <NavigationIcon name="user" />
            <span>{t('Anmelden')}</span>
          </Link>
        }
        languagePicker={<LanguagePicker />}
        themeToggle={<ThemeToggle />}
      />
      <main>
        <label>
          Test draft
          <input value={draft} onChange={(event) => setDraft(event.target.value)} />
        </label>
        <Outlet />
      </main>
    </>
  );
}
const root = createRootRoute({ component: LanguageTestRoot });
const home = createRoute({ getParentRoute: () => root, path: '/', component: HomePage });
const catalog = createRoute({
  getParentRoute: () => root,
  path: '/catalog',
  component: CatalogPage,
});
const profile = createRoute({
  getParentRoute: () => root,
  path: '/account/profile',
  component: ProfilePage,
});
const router = createRouter({
  routeTree: root.addChildren([home, catalog, profile]),
  history: createMemoryHistory({ initialEntries: ['/'] }),
});
void initializeLanguage().then(() =>
  createRoot(document.getElementById('root')!).render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>
    </QueryClientProvider>,
  ),
);
