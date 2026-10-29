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
