// Isolated UI fixture. Not imported by the application or production build.
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import { createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { HeaderView } from '../../src/shared/ui/organisms/Header/Header';
import { ThemeToggle } from '../../src/features/theme/ThemeToggle';
import { NavigationIcon } from '../../src/shared/ui/organisms/Header/NavigationIcon';
import headerStyles from '../../src/shared/ui/organisms/Header/Header.module.css';
import { HomePage } from '../../src/pages/HomePage';
import { Footer } from '../../src/shared/ui/organisms/Footer/Footer';
import { DateRangePicker } from '../../src/features/bookings/components/DateRangePicker/DateRangePicker';
import { Button, Input, Select, Textarea, IconButton } from '../../src/shared/ui/atoms';
import '../../src/index.css';
import layout from '../../src/shared/ui/templates/PageLayout/PageLayout.module.css';

const root = createRootRoute({
  component: () => (
    <>
      <a href="#main-content" className={layout.skip}>
        Zum Inhalt springen
      </a>
      <HeaderView
        themeToggle={<ThemeToggle />}
        auth={
          <a href="/sign-in" className={headerStyles.signInLink}>
            <NavigationIcon name="user" />
            <span>Anmelden</span>
          </a>
        }
        signedIn={new URLSearchParams(location.search).has('signedIn')}
        avatarUrl="/icons/icon-192.png"
        avatarName="Test user"
        onSignOut={() => {
          window.location.href = '/sign-in';
        }}
      />
      <main id="main-content" className={layout.main}>
        <HomePage />
        <form aria-label="Beispielformular">
          <Input label="Name" name="name" error="Bitte gib deinen Namen ein." />
          <Textarea label="Beschreibung" />
          <Select label="Kategorie" options={[{ value: '1', label: 'Elektronik' }]} />
          <Button type="submit">Speichern</Button>
          <Button type="button" variant="secondary">
            Abbrechen
          </Button>
          <Button type="button" variant="danger">
            Löschen
          </Button>
          <IconButton label="Foto entfernen">×</IconButton>
        </form>
        <DateRangePicker pricePerDay="15" onSubmit={async () => {}} />
      </main>
      <Footer />
    </>
  ),
});
const page = createRoute({
  getParentRoute: () => root,
  path: '/tests/fixtures/ui.html',
  component: () => null,
});
const router = createRouter({ routeTree: root.addChildren([page]) });
createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
