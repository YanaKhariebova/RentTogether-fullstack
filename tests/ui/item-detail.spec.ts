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
  await expect(
    page.getByRole('grid', {
      name: new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(new Date()),
    }),
  ).toBeVisible();
});

test('item detail distinguishes server errors from a missing item and offers retry', async ({
  page,
}) => {
  let failed = true;
  await page.route(`**/api/items/${item.id}`, (route) =>
    route.fulfill(
      failed
        ? {
            status: 503,
            json: {
              error: { code: 'UNAVAILABLE', message: 'Bitte versuche es erneut.', fields: {} },
            },
          }
        : { json: { item } },
    ),
  );
  await page.goto(`/items/${item.id}`);
  await expect(
    page.getByRole('heading', { name: 'Anzeige konnte nicht geladen werden' }),
  ).toBeVisible();
  failed = false;
  await page.getByRole('button', { name: 'Erneut versuchen' }).click();
  await expect(page.getByRole('heading', { name: item.title })).toBeVisible();
  await expect(page.getByRole('main')).toHaveCount(1);
});
