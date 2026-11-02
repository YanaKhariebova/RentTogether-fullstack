import { expect, test } from '@playwright/test';

for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
  test(`navigation, form labels and no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/fixtures/ui.html');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Leihen, was du brauchst. Teilen, was du hast.',
    );
    const mobile = page.getByRole('navigation', { name: 'Mobile Navigation' });
    const desktop = page.getByRole('navigation', { name: 'Hauptnavigation' });
    await expect(width < 1024 ? mobile : desktop).toBeVisible();
    await expect(width < 1024 ? desktop : mobile).toBeHidden();
    await expect(
      (width < 1024 ? mobile : desktop).getByRole('link', { name: 'Anfragen' }),
    ).toHaveAttribute('href', '/account/bookings');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    for (const link of await (width < 1024 ? mobile : desktop).getByRole('link').all()) {
      const box = await link.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }
    await expect(
      page.getByRole('textbox', { name: 'Name', exact: true }),
    ).toHaveAccessibleDescription('Bitte gib deinen Namen ein.');
    await expect(page.getByRole('button', { name: 'Foto entfernen' })).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Zum Inhalt springen' })).toBeFocused();
  });
}
