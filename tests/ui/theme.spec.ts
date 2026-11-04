import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const fixture = '/tests/fixtures/ui.html';
const darkLabel = 'Dunkles Design aktivieren';
const lightLabel = 'Helles Design aktivieren';

async function buttonColors(page: Page) {
  const controls = [
    page.getByRole('main').getByRole('link', { name: 'Dinge entdecken' }),
    page.getByRole('main').getByRole('link', { name: 'Etwas verleihen' }),
    ...['Speichern', 'Abbrechen', 'Löschen', 'Foto entfernen'].map((name) =>
      page.getByRole('button', { name, exact: true }),
    ),
  ];
  return Promise.all(
    controls.map((control) =>
      control.evaluate((element) => {
        const style = getComputedStyle(element);
        return { background: style.backgroundColor, text: style.color, border: style.borderColor };
      }),
    ),
  );
}

for (const width of [320, 390, 1440]) {
  test(`theme switches both ways, persists and adapts secondary buttons at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(fixture);
    const brands = [
      page
        .getByRole('banner')
        .getByRole('link', { name: 'RentTogether Weniger kaufen. Mehr teilen.', exact: true }),
      page
        .getByRole('contentinfo')
        .getByRole('link', { name: 'RentTogether – Startseite', exact: true }),
    ];
    for (const brand of brands) {
      const mark = brand.locator('span[aria-hidden="true"]');
      await expect(mark).toHaveCSS('mask-image', /url/);
      await expect(mark).toHaveCSS(
        'background-color',
        await brand
          .getByText('Rent', { exact: true })
          .evaluate((element) => getComputedStyle(element).color),
      );
      await expect(brand.getByText('Rent', { exact: true })).toHaveCSS(
        'color',
        'rgb(44, 150, 112)',
      );
      await expect(brand.getByText('Together', { exact: true })).toHaveCSS(
        'color',
        'rgb(44, 150, 112)',
      );
      const tagline = brand.getByText('Weniger kaufen. Mehr teilen.', { exact: true });
      await expect(tagline).toBeVisible();
      await expect(tagline).toHaveCSS('color', 'rgb(148, 103, 24)');
      const rentBox = await brand.getByText('Rent', { exact: true }).boundingBox();
      const taglineBox = await tagline.boundingBox();
      expect(taglineBox!.x).toBeCloseTo(rentBox!.x, 0);
      expect(taglineBox!.y).toBeGreaterThan(rentBox!.y);
    }
    const originalColors = await buttonColors(page);
    const originalBackground = await page
      .locator('html')
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    if (width < 1024) await page.getByRole('button', { name: 'Menü öffnen' }).click();
    const toggle = page.getByRole('button', { name: darkLabel });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('button', { name: lightLabel })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    if (width < 1024) await page.getByRole('button', { name: 'Menü schließen' }).click();
    for (const brand of brands) {
      const mark = brand.locator('span[aria-hidden="true"]');
      await expect(mark).toHaveCSS('mask-image', /url/);
      await expect(mark).toHaveCSS(
        'background-color',
        await brand
          .getByText('Rent', { exact: true })
          .evaluate((element) => getComputedStyle(element).color),
      );
      await expect(brand.getByText('Rent', { exact: true })).toHaveCSS(
        'color',
        'rgb(121, 211, 171)',
      );
      await expect(brand.getByText('Together', { exact: true })).toHaveCSS(
        'color',
        'rgb(121, 211, 171)',
      );
      const tagline = brand.getByText('Weniger kaufen. Mehr teilen.', { exact: true });
      await expect(tagline).toBeVisible();
      await expect(tagline).toHaveCSS('color', 'rgb(242, 198, 109)');
      const rentBox = await brand.getByText('Rent', { exact: true }).boundingBox();
      const taglineBox = await tagline.boundingBox();
      expect(taglineBox!.x).toBeCloseTo(rentBox!.x, 0);
      expect(taglineBox!.y).toBeGreaterThan(rentBox!.y);
    }
    const darkColors = await buttonColors(page);
    for (const index of [0, 2, 4]) expect(darkColors[index]).toEqual(originalColors[index]);
    for (const index of [3, 5]) {
      expect(darkColors[index].background).toBe('rgb(28, 36, 35)');
      expect(darkColors[index].text).toBe('rgb(121, 211, 171)');
    }
    expect(
      await page.locator('html').evaluate((element) => getComputedStyle(element).backgroundColor),
    ).toBe('rgb(20, 23, 25)');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    if (width < 1024) await page.getByRole('button', { name: 'Menü öffnen' }).click();
    await page.getByRole('button', { name: lightLabel }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    if (width < 1024) await page.getByRole('button', { name: 'Menü schließen' }).click();
    await page.mouse.move(0, 0);
    expect(await buttonColors(page)).toEqual(originalColors);
    expect(
      await page.locator('html').evaluate((element) => getComputedStyle(element).backgroundColor),
    ).toBe(originalBackground);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
}

test('theme stays in sync between tabs', async ({ page, context }) => {
  await page.goto(fixture);
  const secondTab = await context.newPage();
  await secondTab.setViewportSize({ width: 1440, height: 900 });
  await secondTab.goto(fixture);
  await page.getByRole('button', { name: darkLabel }).click();
  await expect(secondTab.locator('html')).toHaveAttribute('data-theme', 'dark');
  await secondTab.getByRole('button', { name: lightLabel }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('switching works when browser storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('Storage unavailable');
      },
    });
  });
  await page.goto(fixture);
  await page.getByRole('button', { name: darkLabel }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: lightLabel }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
