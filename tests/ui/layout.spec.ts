import { expect, test } from '@playwright/test';

for (const width of [320, 360, 390, 430, 768, 1024, 1200, 1323, 1440, 1920]) {
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
    if (width >= 1200) {
      const header = page.getByRole('banner');
      const tagline = header.getByText('Weniger kaufen. Mehr teilen.', { exact: true });
      expect(await tagline.evaluate((el) => el.getBoundingClientRect().height)).toBeLessThan(25);
      for (const link of await desktop.getByRole('link').all()) {
        expect((await link.boundingBox())!.height).toBe(44);
      }
      const brand = header.getByRole('link', { name: 'RentTogether Weniger kaufen. Mehr teilen.' });
      const glass = page
        .locator('main picture')
        .locator('..')
        .locator('..')
        .locator('> div')
        .last();
      expect(
        Math.abs((await brand.boundingBox())!.x - (await glass.boundingBox())!.x),
      ).toBeLessThan(1);
      const footerInset = await page
        .getByRole('contentinfo')
        .locator('> div')
        .evaluate((el) => {
          const box = el.getBoundingClientRect();
          return box.x + parseFloat(getComputedStyle(el).paddingLeft);
        });
      expect(Math.abs(footerInset - (await brand.boundingBox())!.x)).toBeLessThan(1);
    }
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
