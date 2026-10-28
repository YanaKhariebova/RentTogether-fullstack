// Isolated UI fixture. Not imported by the application or production build.
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import { createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { HeaderView } from '../../src/shared/ui/organisms/Header/Header';
import { HomePage } from '../../src/pages/HomePage';
import { Button, Input, Select, Textarea, IconButton } from '../../src/shared/ui/atoms';
import '../../src/index.css';
import layout from '../../src/shared/ui/templates/PageLayout/PageLayout.module.css';

const root = createRootRoute({
  component: () => (
    <>
      <a href="#main-content" className={layout.skip}>
        Zum Inhalt springen
      </a>
      <HeaderView auth={<a href="/sign-in">Anmelden</a>} />
      <main id="main-content" className={layout.main}>
        <HomePage />
        <form aria-label="Beispielformular">
          <Input label="Name" name="name" error="Bitte gib deinen Namen ein." />
          <Textarea label="Beschreibung" />
          <Select label="Kategorie" options={[{ value: '1', label: 'Elektronik' }]} />
          <Button type="submit">Speichern</Button>
          <IconButton label="Foto entfernen">×</IconButton>
        </form>
      </main>
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
