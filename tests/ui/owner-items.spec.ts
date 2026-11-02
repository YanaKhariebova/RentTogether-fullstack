import { expect, test } from '@playwright/test';

test('owner workspace renders loading and empty states', async ({ page }) => {
  await page.goto('/tests/fixtures/owner-items.html?state=loading');
  await expect(
    page.getByRole('status').filter({ hasText: 'Deine Anzeigen werden geladen' }),
  ).toBeVisible();
  await page.goto('/tests/fixtures/owner-items.html?state=empty');
  await expect(page.getByText('Hier ist Platz für deine erste Anzeige.')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Erste Anzeige erstellen', exact: true }),
  ).toBeVisible();
});

test('owner workspace recovers from a load error using retry', async ({ page }) => {
  await page.goto('/tests/fixtures/owner-items.html?state=error');
  await expect(page.getByRole('alert')).toContainText('Das hat leider nicht geklappt.');
  await page.getByRole('button', { name: 'Erneut versuchen', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Beamer für einen Filmabend', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('invalid owner form announces errors and focuses the first invalid field after keyboard submission', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/owner-items.html');
  await page.getByRole('button', { name: '+ Neue Anzeige', exact: true }).click();
  const submit = page.getByRole('button', { name: 'Vorschau anzeigen', exact: true });
  await submit.focus();
  await submit.press('Enter');
  const title = page.getByLabel('Titel *', { exact: true });
  await expect(title).toHaveAttribute('aria-invalid', 'true');
  await expect(title).toBeFocused();
  await expect(page.getByRole('alert')).toContainText('Bitte überprüfe die markierten Felder.');
  await expect(title).toHaveAttribute('aria-describedby', /.+/);
});

for (const width of [360, 390, 768, 1024, 1440]) {
  test(`owner cards and form fit both themes at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/fixtures/owner-items.html');
    await expect(
      page.getByRole('heading', { name: 'Beamer für einen Filmabend', exact: true }),
    ).toBeVisible();
    for (const theme of ['dark', 'light']) {
      await page
        .getByRole('button', {
          name: theme === 'dark' ? 'Dunkles Design aktivieren' : 'Helles Design aktivieren',
          exact: true,
        })
        .click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await page.getByRole('button', { name: '+ Neue Anzeige', exact: true }).click();
    await expect(page.getByLabel('Titel *', { exact: true })).toBeVisible();
    for (const theme of ['dark', 'light']) {
      await page
        .getByRole('button', {
          name: theme === 'dark' ? 'Dunkles Design aktivieren' : 'Helles Design aktivieren',
          exact: true,
        })
        .click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  });
}

test('owner heart is visible but unavailable until the shared favorites adapter is connected', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/owner-items.html');
  const heart = page.getByRole('button', {
    name: 'Beamer für einen Filmabend: Favoriten sind bald verfügbar.',
    exact: true,
  });
  await expect(heart).toBeVisible();
  await expect(heart).toBeDisabled();
  await expect(heart).not.toHaveAttribute('aria-pressed');
});

test('controlled owner heart waits for confirmation and can be toggled using keyboard', async ({
  page,
}) => {
  // Only the isolated fixture has this fake adapter; it does not persist or contact an API.
  await page.goto('/tests/fixtures/owner-items.html?favorite=demo');
  const heart = page.getByRole('button', {
    name: 'Beamer für einen Filmabend zu Favoriten hinzufügen',
    exact: true,
  });
  await expect(heart).toHaveAttribute('aria-pressed', 'false');
  await heart.focus();
  await heart.press('Enter');
  const selected = page.getByRole('button', {
    name: 'Beamer für einen Filmabend aus Favoriten entfernen',
    exact: true,
  });
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
  await selected.press('Enter');
  await expect(heart).toHaveAttribute('aria-pressed', 'false');
});

test('owner heart keeps its unselected state and announces a failed save', async ({ page }) => {
  await page.goto('/tests/fixtures/owner-items.html?favorite=error');
  const heart = page.getByRole('button', {
    name: 'Beamer für einen Filmabend zu Favoriten hinzufügen',
    exact: true,
  });
  await heart.click();
  await expect(page.getByRole('alert')).toContainText(
    'Favoriten konnten nicht gespeichert werden.',
  );
  await expect(heart).toHaveAttribute('aria-pressed', 'false');
  await expect(heart).toBeEnabled();
});
