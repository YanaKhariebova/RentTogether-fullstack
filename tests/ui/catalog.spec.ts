import { expect, test } from '@playwright/test';

const category = { id: '10000000-0000-4000-8000-000000000001', name: 'Elektronik' };
const item = {
  id: '20000000-0000-4000-8000-000000000001',
  title: 'Beamer für einen Filmabend',
  description: 'Ein Beamer mit HDMI-Anschluss.',
  pricePerDay: '15.50',
  city: 'Berlin',
  category,
  images: [
    {
      id: '30000000-0000-4000-8000-000000000001',
      url: 'https://example.test/beamer.webp',
      order: 0,
    },
  ],
  owner: { id: '40000000-0000-4000-8000-000000000001', name: 'Olga', city: 'Berlin' },
  isPublished: true,
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/items/cities', (route) =>
    route.fulfill({ json: { cities: ['Berlin', 'Hamburg'] } }),
  );
});

test('catalog renders a card received from the public API', async ({ page }) => {
  await page.route('**/api/categories', (route) =>
    route.fulfill({ json: { categories: [category] } }),
  );
  await page.route('**/api/items?**', (route) =>
    route.fulfill({
      json: {
        items: [item],
        pagination: { page: 1, limit: 9, total: 1, totalPages: 1 },
      },
    }),
  );

  await page.goto('/catalog');

  await expect(page.getByText('1 Anzeige gefunden')).toBeVisible();
  await expect(page.getByRole('heading', { name: item.title })).toBeVisible();
  const itemCard = page.getByRole('link', { name: item.title });
  await expect(itemCard).toContainText('Elektronik');
  await expect(itemCard).toContainText('Berlin');
});

test('price filters send API decimals and changing filters resets pagination', async ({ page }) => {
  await page.route('**/api/categories', (route) =>
    route.fulfill({ json: { categories: [category] } }),
  );
  await page.route('**/api/items/cities', (route) =>
    route.fulfill({ json: { cities: ['Berlin', 'Hamburg'] } }),
  );
  await page.route('**/api/items?**', (route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams;
    const filtered = query.has('q');
    return route.fulfill({
      json: {
        items: filtered && query.get('page') !== '1' ? [] : [item],
        pagination: {
          page: Number(query.get('page')),
          limit: 9,
          total: filtered ? 1 : 18,
          totalPages: filtered ? 1 : 2,
        },
      },
    });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/catalog');
  await page.getByRole('button', { name: 'Seite 2', exact: true }).click();
  const request = page.waitForRequest(
    (request) => new URL(request.url()).searchParams.get('q') === 'Filmabend',
  );
  await page.getByRole('searchbox', { name: 'Wonach suchst du?' }).fill('Filmabend');
  expect(new URL((await request).url()).searchParams.get('page')).toBe('1');
  await expect(page.getByRole('heading', { name: item.title })).toBeVisible();
  const priceRequest = page.waitForRequest((request) =>
    new URL(request.url()).searchParams.has('minPrice'),
  );
  await page.getByRole('spinbutton', { name: 'Min. Preis (€)' }).last().fill('15');
  expect(new URL((await priceRequest).url()).searchParams.get('minPrice')).toBe('15.00');
});

test('city choices remain available after applying a city filter', async ({ page }) => {
  await page.route('**/api/categories', (route) =>
    route.fulfill({ json: { categories: [category] } }),
  );
  await page.route('**/api/items/cities', (route) =>
    route.fulfill({ json: { cities: ['Berlin', 'Hamburg'] } }),
  );
  await page.route('**/api/items?**', (route) =>
    route.fulfill({
      json: {
        items: [item],
        pagination: { page: 1, limit: 9, total: 1, totalPages: 1 },
      },
    }),
  );
  await page.goto('/catalog');
  await page.getByRole('combobox', { name: 'Stadt', exact: true }).selectOption('Berlin');
  await expect(
    page
      .getByRole('combobox', { name: 'Stadt', exact: true })
      .getByRole('option', { name: 'Hamburg', exact: true }),
  ).toHaveCount(1);
});

test('invalid price range shows validation instead of an API failure', async ({ page }) => {
  await page.route('**/api/categories', (route) =>
    route.fulfill({ json: { categories: [category] } }),
  );
  await page.route('**/api/items?**', (route) =>
    route.fulfill({
      json: { items: [item], pagination: { page: 1, limit: 9, total: 1, totalPages: 1 } },
    }),
  );
  await page.goto('/catalog');
  await page.getByRole('spinbutton', { name: 'Min. Preis (€)' }).last().fill('20');
  await page.getByRole('spinbutton', { name: 'Max. Preis (€)' }).last().fill('10');
  await expect(page.getByRole('alert')).toContainText('Mindestpreis');
  await page.getByRole('spinbutton', { name: 'Max. Preis (€)' }).last().fill('30');
  await expect(page.getByRole('heading', { name: item.title })).toBeVisible();
  await expect(page.getByRole('main')).toHaveCount(1);
});

test('sidebar limits categories and cities, expands them and searches the full city list', async ({
  page,
}) => {
  const categories = [
    category,
    ...['Haushalt & Garten', 'Sport & Freizeit', 'Werkzeug', 'Musik', 'Sonstiges'].map(
      (name, index) => ({
        id: `10000000-0000-4000-8000-00000000000${index + 2}`,
        name,
      }),
    ),
  ];
  await page.route('**/api/categories', (route) => route.fulfill({ json: { categories } }));
  await page.route('**/api/items/cities', (route) =>
    route.fulfill({
      json: {
        cities: ['Berlin', 'Bremen', 'Dresden', 'Frankfurt', 'Hamburg', 'Magdeburg'],
      },
    }),
  );
  await page.route('**/api/items?**', (route) =>
    route.fulfill({
      json: {
        items: [item],
        pagination: { page: 1, limit: 9, total: 1, totalPages: 1 },
      },
    }),
  );
  await page.goto('/catalog');
  const filters = page.getByRole('complementary', { name: 'Katalogfilter' });
  await expect(filters.getByRole('button', { name: 'Werkzeug', exact: true })).toBeVisible();
  await expect(filters.getByRole('button', { name: 'Musik', exact: true })).toHaveCount(0);
  const expandCategories = filters.getByRole('button', {
    name: 'Alle Kategorien anzeigen',
    exact: true,
  });
  await expect(expandCategories).toHaveAttribute('aria-expanded', 'false');
  await expandCategories.press('Enter');
  await expect(filters.getByRole('button', { name: 'Sonstiges', exact: true })).toBeVisible();
  await filters.getByRole('button', { name: 'Weniger Kategorien anzeigen', exact: true }).click();
  await expect(filters.getByRole('button', { name: 'Musik', exact: true })).toHaveCount(0);

  await expect(filters.getByRole('radio')).toHaveCount(4);
  await expect(filters.getByRole('radio', { name: 'Hamburg', exact: true })).toHaveCount(0);
  await filters.getByRole('button', { name: 'Alle Städte anzeigen', exact: true }).click();
  await expect(filters.getByRole('radio')).toHaveCount(6);
  await filters.getByRole('button', { name: 'Weniger Städte anzeigen', exact: true }).click();
  await expect(filters.getByRole('radio')).toHaveCount(4);

  const searchCity = filters.getByRole('searchbox', { name: 'Stadt suchen', exact: true });
  await searchCity.fill('  HAMB  ');
  const hamburg = filters.getByRole('radio', { name: 'Hamburg', exact: true });
  await expect(hamburg).toBeVisible();
  await expect(filters.getByRole('radio')).toHaveCount(1);
  await expect(hamburg).toHaveCSS('width', '14px');
  await expect(hamburg).toHaveCSS('height', '14px');
  const selectedCityRequest = page.waitForRequest(
    (request) =>
      request.url().includes('/api/items?') &&
      new URL(request.url()).searchParams.get('city') === 'Hamburg',
  );
  await hamburg.check();
  expect(new URL((await selectedCityRequest).url()).searchParams.get('page')).toBe('1');
  await expect(hamburg).toBeChecked();
  await expect(page.getByRole('combobox', { name: 'Stadt', exact: true })).toHaveValue('Hamburg');

  await searchCity.fill('keine-solche-stadt');
  await expect(filters.getByRole('status')).toHaveText('Keine Stadt gefunden.');
  await expect(page.getByRole('combobox', { name: 'Stadt', exact: true })).toHaveValue('Hamburg');
  await searchCity.fill('');
  await expect(filters.getByRole('radio')).toHaveCount(4);
});

for (const theme of ['light', 'dark']) {
  test(`expansion buttons remain available with four categories and cities and fit the ${theme} theme`, async ({
    page,
  }) => {
    await page.addInitScript((value) => localStorage.setItem('renttogether-theme', value), theme);
    await page.route('**/api/categories', (route) =>
      route.fulfill({
        json: {
          categories: [
            category,
            ...['Haushalt & Garten', 'Sport & Freizeit', 'Werkzeug'].map((name, index) => ({
              id: `10000000-0000-4000-8000-00000000000${index + 2}`,
              name,
            })),
          ],
        },
      }),
    );
    await page.route('**/api/items/cities', (route) =>
      route.fulfill({
        json: {
          cities: ['Berlin', 'Bremen', 'Dresden', 'Frankfurt'],
        },
      }),
    );
    await page.route('**/api/items?**', (route) =>
      route.fulfill({
        json: {
          items: [item],
          pagination: { page: 1, limit: 9, total: 1, totalPages: 1 },
        },
      }),
    );
    await page.goto('/catalog');
    const filters = page.getByRole('complementary', { name: 'Katalogfilter' });
    const categoriesButton = filters.getByRole('button', {
      name: 'Alle Kategorien anzeigen',
      exact: true,
    });
    await expect(categoriesButton).toBeVisible();
    for (const button of [
      categoriesButton,
      filters.getByRole('button', { name: 'Alle Städte anzeigen', exact: true }),
    ]) {
      await expect(button).toHaveCSS(
        'background-color',
        theme === 'dark' ? 'rgb(28, 36, 35)' : 'rgb(232, 242, 238)',
      );
      await expect(button).toHaveCSS(
        'color',
        theme === 'dark' ? 'rgb(121, 211, 171)' : 'rgb(36, 92, 60)',
      );
      await button.hover();
      await expect(button).toHaveCSS(
        'background-color',
        theme === 'dark' ? 'rgb(20, 23, 25)' : 'rgb(245, 248, 244)',
      );
    }
    const citiesButton = filters.getByRole('button', { name: 'Alle Städte anzeigen', exact: true });
    await citiesButton.click();
    await expect(
      filters.getByRole('button', { name: 'Weniger Städte anzeigen', exact: true }),
    ).toHaveAttribute('aria-expanded', 'true');
    await expect(filters.getByRole('radio')).toHaveCount(4);
  });
}
