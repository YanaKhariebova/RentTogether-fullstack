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
  test(`theme switches both ways, persists and preserves button colors at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(fixture);
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
    expect((await buttonColors(page)).filter((_, i) => i !== 1)).toEqual(
      originalColors.filter((_, i) => i !== 1),
    );
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
