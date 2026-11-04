import { expect, test } from '@playwright/test';

for (const width of [320, 768, 1024, 1440]) {
  test(`owner card rows align despite different titles and action wrapping at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/tests/fixtures/owner-items.html?state=alignment&actions=all');
    await expect(page.getByRole('article')).toHaveCount(6);
    for (const theme of ['dark', 'light']) {
      await page
        .getByRole('button', {
          name: theme === 'dark' ? 'Dunkles Design aktivieren' : 'Helles Design aktivieren',
          exact: true,
        })
        .click();
      const cards = await page.getByRole('article').evaluateAll((els) =>
        els.map((el) => {
          const box = el.getBoundingClientRect();
          const title = el.querySelector('h3')!;
          const city = title.nextElementSibling!;
          const meta = city.nextElementSibling!;
          const actions = meta.nextElementSibling!;
          return {
            top: box.top,
            bottom: box.bottom,
            city: city.getBoundingClientRect().top,
            meta: meta.getBoundingClientRect().top,
            category: meta.firstElementChild!.getBoundingClientRect().top,
            price: meta.lastElementChild!.getBoundingClientRect().top,
            actions: actions.getBoundingClientRect().top,
            buttonsBottomGap:
              box.bottom -
              Math.max(
                ...Array.from(
                  actions.querySelectorAll('button'),
                  (button) => button.getBoundingClientRect().bottom,
                ),
              ),
            buttonHeights: Array.from(
              actions.querySelectorAll('button'),
              (button) => button.getBoundingClientRect().height,
            ),
            titleFits: title.scrollHeight <= title.clientHeight,
          };
        }),
      );
      for (const card of cards) {
        expect(card.titleFits).toBe(true);
        expect(card.buttonsBottomGap).toBeCloseTo(19, 0);
        for (const height of card.buttonHeights) expect(height).toBeCloseTo(44, 0);
        for (const peer of cards.filter((other) => Math.abs(other.top - card.top) < 1)) {
          for (const key of ['bottom', 'city', 'meta', 'category', 'price', 'actions'] as const)
            expect(Math.abs(card[key] - peer[key])).toBeLessThan(1);
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  });
}

for (const theme of ['light', 'dark']) {
  for (const field of ['city', 'images']) {
    test(`server ${field} error marks the field and allows correction in ${theme}`, async ({
      page,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('renttogether-theme', value), theme);
      await page.route('**/api/locations?**', (route) =>
        route.fulfill({
          json: {
            places: [
              {
                id: 'berlin',
                name: 'Berlin',
                region: 'Berlin',
                country: 'Deutschland',
                countryCode: 'DE',
                postcodes: ['10115'],
              },
            ],
          },
        }),
      );
      await page.goto(
        '/tests/fixtures/owner-items.html?saveError=' + (field === 'city' ? 'city' : 'images'),
      );
      if (theme === 'dark')
        await page.getByRole('button', { name: 'Dunkles Design aktivieren', exact: true }).click();
      if (theme === 'dark')
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await page.getByRole('button', { name: '+ Neue Anzeige', exact: true }).click();
      await page.getByLabel('Titel *', { exact: true }).fill('Testangebot mit Foto');
      await page
        .getByLabel('Beschreibung *', { exact: true })
        .fill('Ein vollständiges Angebot für die Prüfung.');
      await page
        .getByRole('combobox', { name: 'Ort *', exact: true })
        .fill(field === 'city' ? 'Berln' : 'Berlin');
      await page.getByLabel('Kategorie *', { exact: true }).selectOption({ label: 'Elektronik' });
      await page.getByLabel('Preis pro Tag', { exact: false }).fill('12,50');
      const upload = page.getByLabel('Fotos auswählen', { exact: true });
      await upload.setInputFiles('public/icons/icon-192.png');
      await page.getByRole('button', { name: 'Vorschau anzeigen', exact: true }).click();
      await page.getByRole('button', { name: 'Anzeige speichern', exact: true }).click();
      const invalid =
        field === 'city' ? page.getByRole('combobox', { name: 'Ort *', exact: true }) : upload;
      await expect(invalid).toHaveAttribute('aria-invalid', 'true');
      await expect(invalid).toBeFocused();
      await expect(invalid).toHaveAccessibleDescription(
        field === 'city' ? /Ortsname oder Postleitzahl/ : /gültiges Foto/,
      );
      await expect(invalid).toHaveCSS(
        'border-top-color',
        theme === 'dark' ? 'rgb(237, 170, 167)' : 'rgb(152, 75, 72)',
      );
      await expect(
        page.getByRole('button', { name: 'Anzeige speichern', exact: true }),
      ).toHaveCount(0);
      await expect(page.getByLabel('Titel *', { exact: true })).toHaveValue('Testangebot mit Foto');
      if (field === 'city') {
        await invalid.fill('Berlin');
      } else {
        await page.getByRole('button', { name: 'Foto 1 entfernen', exact: true }).click();
        await upload.setInputFiles('public/icons/icon-192.png');
      }
      await expect(invalid).toHaveAttribute('aria-invalid', 'false');
      await page.getByRole('button', { name: 'Vorschau anzeigen', exact: true }).click();
      await page.getByRole('button', { name: 'Anzeige speichern', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Meine Anzeigen', exact: true }),
      ).toBeVisible();
    });
  }
  test(`unsupported photo marks upload red and explains supported formats in ${theme}`, async ({
    page,
  }) => {
    await page.addInitScript((value) => localStorage.setItem('renttogether-theme', value), theme);
    await page.goto('/tests/fixtures/owner-items.html');
    if (theme === 'dark')
      await page.getByRole('button', { name: 'Dunkles Design aktivieren', exact: true }).click();
    await page.getByRole('button', { name: '+ Neue Anzeige', exact: true }).click();
    const upload = page.getByLabel('Fotos auswählen', { exact: true });
    await upload.setInputFiles({
      name: 'photo.heic',
      mimeType: 'image/heic',
      buffer: Buffer.from('unsupported'),
    });
    await expect(upload).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('alert')).toContainText(
      'photo.heic: Erlaubt sind JPEG, PNG und WebP.',
    );
    await expect(page.getByText(/Erlaubte Formate: JPG\/JPEG/)).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: '0 von 8 Fotos' })).toBeVisible();
    await upload.setInputFiles('public/icons/icon-192.png');
    await expect(upload).toHaveAttribute('aria-invalid', 'false');
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
}

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

for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
  test(`owner cards and form fit both themes at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/fixtures/owner-items.html?actions=all');
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
      for (const action of ['bearbeiten', 'veröffentlichen', 'löschen']) {
        const button = page.getByRole('button', {
          name: `Beamer für einen Filmabend ${action}`,
          exact: true,
        });
        const spacing = await button.evaluate((el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          const text = range.getBoundingClientRect();
          const box = el.getBoundingClientRect();
          const card = el.closest('article')!.getBoundingClientRect();
          return {
            left: text.left - box.left,
            right: box.right - text.right,
            inside: box.left >= card.left && box.right <= card.right,
          };
        });
        expect(spacing.left).toBeGreaterThanOrEqual(8);
        expect(spacing.right).toBeGreaterThanOrEqual(8);
        expect(spacing.inside).toBe(true);
      }
    }
    await page.getByRole('button', { name: '+ Neue Anzeige', exact: true }).click();
    await expect(page.getByLabel('Titel *', { exact: true })).toBeVisible();
    await page.getByLabel('Fotos auswählen').setInputFiles('public/icons/icon-192.png');
    await expect(
      page.getByRole('img', { name: 'Foto 1: icon-192.png', exact: true }),
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
    await page.goto('/tests/fixtures/owner-items.html');
    await page
      .getByRole('button', { name: 'Beamer für einen Filmabend bearbeiten', exact: true })
      .click();
    await expect(page.getByLabel('Titel *', { exact: true })).toHaveValue(
      'Beamer für einen Filmabend',
    );
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
    await page.goto('/tests/fixtures/owner-items.html?state=published');
    await page
      .getByRole('button', { name: 'Beamer für einen Filmabend ausblenden', exact: true })
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(width);
    await dialog.getByRole('button', { name: 'Abbrechen', exact: true }).click();
    await expect(dialog).not.toBeVisible();
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
