import { expect, test } from '@playwright/test';

const item = {
  id: '20000000-0000-4000-8000-000000000001',
  title: 'Beamer für einen Filmabend',
  description: 'Ein Beamer mit HDMI-Anschluss.',
  pricePerDay: '15.50',
  city: 'Berlin',
  isPublished: true,
  category: { id: '10000000-0000-4000-8000-000000000001', name: 'Elektronik' },
  images: [
    { id: '30000000-0000-4000-8000-000000000001', url: '/media/hero-mobile-640.webp', order: 0 },
  ],
  owner: { id: '40000000-0000-4000-8000-000000000001', name: 'Olga', city: 'Berlin' },
};

for (const theme of ['light', 'dark']) {
  for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
    test(`catalog and item detail fit ${width}px ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.addInitScript((value) => localStorage.setItem('renttogether-theme', value), theme);
      await page.route('**/api/categories', (route) =>
        route.fulfill({ json: { categories: [item.category] } }),
      );
      await page.route('**/api/items/cities', (route) =>
        route.fulfill({ json: { cities: ['Berlin'] } }),
      );
      await page.route('**/api/items?**', (route) =>
        route.fulfill({
          json: { items: [item], pagination: { page: 1, limit: 9, total: 1, totalPages: 1 } },
        }),
      );
      await page.route(`**/api/items/${item.id}`, (route) => route.fulfill({ json: { item } }));
      await page.route('**/api/bookings/items/*/unavailable-dates', (route) =>
        route.fulfill({ json: { ranges: [] } }),
      );
      await page.goto('/catalog');
      await expect(page.getByRole('heading', { name: item.title })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.getByRole('link', { name: item.title }).click();
      await expect(page.getByRole('heading', { name: 'Zeitraum auswählen' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.getByRole('button', { name: 'Zeitraum auswählen', exact: true }).click();
      const calendar = page.getByRole('grid');
      await calendar.scrollIntoViewIfNeeded();
      expect(
        await calendar.evaluate((grid) => {
          const container = grid.closest('.rdp-root')!;
          return container.scrollWidth <= container.clientWidth;
        }),
      ).toBe(true);
      for (const day of await calendar.getByRole('button').all()) {
        const box = await day.boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
    });

    test(`mobile shell, photo, calendar and footer: ${width}px ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.addInitScript((value) => localStorage.setItem('renttogether-theme', value), theme);
      const requests: string[] = [];
      page.on('request', (request) => requests.push(request.url()));
      await page.goto('/tests/fixtures/ui.html');
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (width < 768) {
        const photo = page.locator('main picture img');
        await expect(photo).toBeVisible();
        expect(await photo.evaluate((img) => (img as HTMLImageElement).currentSrc)).toContain(
          'hero-mobile-',
        );
        expect(requests.some((url) => url.endsWith('/hero-brownstone.webp'))).toBe(false);
        const photoBox = await photo.boundingBox();
        const titleBox = await page.getByRole('heading', { level: 1 }).boundingBox();
        expect(photoBox!.y).toBeLessThan(titleBox!.y);
        expect(photoBox!.y + photoBox!.height).toBeGreaterThan(titleBox!.y + titleBox!.height);
        const glass = page
          .locator('main picture')
          .locator('..')
          .locator('..')
          .locator('> div')
          .last();
        await expect(glass).toHaveCSS('border-radius', '22px');
      }
      await page.getByRole('button', { name: 'Zeitraum auswählen', exact: true }).click();
      const nextMonth = page.getByRole('button', { name: /nächsten Monat/i });
      await nextMonth.scrollIntoViewIfNeeded();
      const box = await nextMonth.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
      await nextMonth.click();
      const footerLink = page
        .getByRole('contentinfo')
        .getByRole('link', { name: 'Zum Seitenanfang' });
      await footerLink.scrollIntoViewIfNeeded();
      const footerBox = await footerLink.boundingBox();
      expect(footerBox!.y + footerBox!.height).toBeLessThanOrEqual(844 - (width < 1024 ? 56 : 0));
      if (width < 1024) {
        await page.getByRole('textbox', { name: 'Name', exact: true }).focus();
        await expect(page.getByRole('navigation', { name: 'Mobile Navigation' })).toBeHidden();
      }
    });
  }
}

test.describe('mobile drawer', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test('traps focus, locks scrolling, closes with Escape, button and backdrop, restores focus', async ({
    page,
  }) => {
    await page.goto('/tests/fixtures/ui.html');
    const trigger = page.getByRole('button', { name: 'Menü öffnen' });
    const close = page.getByRole('button', { name: 'Menü schließen' });
    const dialog = page.getByRole('dialog');
    for (const method of ['escape', 'button', 'backdrop']) {
      await trigger.tap();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(close).toBeFocused();
      const panelBox = await dialog.boundingBox();
      expect(panelBox!.width).toBeCloseTo(page.viewportSize()!.width / 2, 0);
      expect(panelBox!.x).toBeCloseTo(page.viewportSize()!.width / 2, 0);
      expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
      await page.keyboard.press('Shift+Tab');
      await expect(dialog.getByRole('link', { name: 'Anmelden', exact: true })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(close).toBeFocused();
      if (method === 'escape') await page.keyboard.press('Escape');
      if (method === 'button') await close.tap();
      if (method === 'backdrop') await page.touchscreen.tap(5, 200);
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toBeFocused();
      expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    }
  });

  test('guest and signed-in views, theme switch and closing on navigation', async ({ page }) => {
    await page.goto('/tests/fixtures/ui.html?signedIn=1');
    await page.getByRole('button', { name: 'Menü öffnen' }).tap();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('link', { name: 'Mein Profil', exact: true })).toHaveAttribute(
      'href',
      '/account/profile',
    );
    await expect(dialog.getByRole('link', { name: 'Anmelden', exact: true })).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Dunkles Design aktivieren' }).tap();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await dialog.getByRole('link', { name: 'Entdecken', exact: true }).tap();
    await expect(page).toHaveURL(/\/catalog$/);
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('resizing to desktop closes the drawer and restores scrolling', async ({ page }) => {
    await page.goto('/tests/fixtures/ui.html');
    await page.getByRole('button', { name: 'Menü öffnen' }).tap();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toBeVisible();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  });
});

test('manifest and install icons are served with correct dimensions', async ({ page, request }) => {
  const response = await request.get('/manifest.webmanifest');
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest).toMatchObject({
    name: 'RentTogether',
    start_url: '/',
    scope: '/',
    display: 'standalone',
  });
  await page.goto('/');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    '/manifest.webmanifest',
  );
  for (const icon of [
    ...manifest.icons,
    { src: '/icons/apple-touch-icon.png', sizes: '180x180' },
  ]) {
    const dimensions = await page.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      return `${img.naturalWidth}x${img.naturalHeight}`;
    }, icon.src);
    expect(dimensions).toBe(icon.sizes);
  }
  expect(
    await page.evaluate(() =>
      navigator.serviceWorker.getRegistrations().then((list) => list.length),
    ),
  ).toBe(0);
});
