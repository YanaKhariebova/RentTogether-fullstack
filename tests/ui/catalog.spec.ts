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
