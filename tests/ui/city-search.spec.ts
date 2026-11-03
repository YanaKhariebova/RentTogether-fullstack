import { test, expect } from '@playwright/test';
const place = {
  id: '15003000:Magdeburg',
  name: 'Magdeburg',
  region: 'Sachsen-Anhalt',
  country: 'Deutschland',
  countryCode: 'DE',
  postcodes: ['39104'],
};

test('postal search chooses a canonical city with the keyboard', async ({ page }) => {
  await page.route('**/api/locations?**', (route) => {
    expect(new URL(route.request().url()).searchParams.get('q')).toBe('39104');
    return route.fulfill({ json: { places: [place] } });
  });
  await page.goto('/tests/fixtures/city-search.html');
  const city = page.getByRole('combobox', { name: 'Ort *', exact: true });
  await city.fill('39104');
  await expect(page.getByRole('option')).toContainText('Magdeburg');
  await city.press('ArrowDown');
  await city.press('Enter');
  await expect(city).toHaveValue('Magdeburg');
  await expect(page.getByRole('listbox')).toHaveCount(0);
});

test('empty results differ from an unavailable provider; retry works', async ({ page }) => {
  let fail = false;
  await page.route('**/api/locations?**', (route) =>
    route.fulfill(
      fail
        ? {
            status: 503,
            json: { error: { code: 'LOCATION_SERVICE_UNAVAILABLE', message: 'Unavailable' } },
          }
        : { json: { places: [] } },
    ),
  );
  await page.goto('/tests/fixtures/city-search.html');
  const city = page.getByRole('combobox', { name: 'Ort *', exact: true });
  await city.fill('Berln');
  await expect(page.getByRole('status').filter({ hasText: 'Kein Ort gefunden' })).toBeVisible();
  fail = true;
  await city.fill('Berlin');
  await expect(page.getByRole('alert')).toContainText('nicht erreichbar');
  fail = false;
  await page.getByRole('button', { name: 'Erneut versuchen' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Kein Ort gefunden' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

for (const theme of ['light', 'dark']) {
  test('city dropdown fits 320px in ' + theme, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.addInitScript((value) => localStorage.setItem('renttogether-theme', value), theme);
    await page.route('**/api/locations?**', (route) =>
      route.fulfill({ json: { places: [place] } }),
    );
    await page.goto('/tests/fixtures/city-search.html');
    await page.getByRole('combobox', { name: 'Ort *', exact: true }).fill('Mag');
    const option = page.getByRole('option');
    await expect(option).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const popup = option.locator('..').locator('..').locator('..');
    await expect(popup).toHaveCSS(
      'background-color',
      theme === 'dark' ? 'rgb(34, 40, 43)' : 'rgb(255, 255, 255)',
    );
    await option.click();
    await expect(page.getByRole('combobox')).toHaveValue('Magdeburg');
  });
}

test('locations with spaces have a valid active option and remain selectable', async ({ page }) => {
  const cityName = 'Bad Homburg vor der Höhe';
  await page.route('**/api/locations?**', (route) =>
    route.fulfill({
      json: {
        places: [
          {
            ...place,
            id: '06434001:' + cityName,
            name: cityName,
            region: 'Hessen',
            postcodes: ['61348'],
          },
        ],
      },
    }),
  );
  await page.goto('/tests/fixtures/city-search.html');
  const city = page.getByRole('combobox', { name: 'Ort *', exact: true });
  await city.fill('Bad');
  await expect(page.getByRole('option')).toBeVisible();
  await city.press('ArrowDown');
  const active = await city.getAttribute('aria-activedescendant');
  expect(active).not.toMatch(/\s/);
  await expect(page.getByRole('option')).toHaveAttribute('id', active!);
  await city.press('Enter');
  await expect(city).toHaveValue(cityName);
});
