import { expect, test } from '@playwright/test';

const item = {
  id: '20000000-0000-4000-8000-000000000001',
  title: 'Beamer für einen Filmabend',
  description: 'Ein Beamer mit HDMI-Anschluss.',
  pricePerDay: '15.50',
  city: 'Berlin',
  category: { id: '10000000-0000-4000-8000-000000000001', name: 'Elektronik' },
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

test('item detail renders the item received from the public API', async ({ page }) => {
  await page.route(`**/api/items/${item.id}`, (route) => route.fulfill({ json: { item } }));

  await page.goto(`/items/${item.id}`);

  await expect(page.getByRole('heading', { name: item.title })).toBeVisible();
  await expect(page.getByText('Elektronik')).toBeVisible();
  await expect(page.getByText('📍 Berlin')).toBeVisible();
  await expect(page.getByText('15,50 € / Tag')).toBeVisible();
  await expect(page.getByText('Angeboten von Olga')).toBeVisible();
});

test('item detail shows the not-found state when the API returns 404', async ({ page }) => {
  const missingId = '50000000-0000-4000-8000-000000000001';
  await page.route(`**/api/items/${missingId}`, (route) =>
    route.fulfill({
      status: 404,
      json: {
        error: {
          code: 'ITEM_NOT_FOUND',
          message: 'Die Anzeige wurde nicht gefunden.',
          fields: {},
        },
      },
    }),
  );

  await page.goto(`/items/${missingId}`);

  await expect(page.getByRole('heading', { name: 'Anzeige nicht gefunden' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Zurück zum Katalog' })).toBeVisible();
});
