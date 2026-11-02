import { expect, test } from '@playwright/test';

for (const path of [
  '/',
  '/catalog',
  '/so-funktionierts',
  '/ueber-uns',
  '/hilfe',
  '/sicherheit',
  '/datenschutz',
  '/impressum',
  '/unbekannte-seite',
]) {
  test(`public route ${path} renders without a JavaScript exception`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(path);
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('contentinfo')).toBeVisible();
    expect(errors).toEqual([]);
  });
}
