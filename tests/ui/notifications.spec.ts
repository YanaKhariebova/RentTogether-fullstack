import { expect, test } from '@playwright/test';

test('booking count is visible, capped at 99+ and independent of Nachrichten', async ({ page }) => {
  await page.goto('/tests/fixtures/notifications.html?count=120');
  const nav = page.getByRole('navigation', { name: 'Hauptnavigation', exact: true });
  const bookings = nav.getByRole('link', { name: 'Anfragen', exact: true });
  await expect(bookings).toContainText('99+');
  await expect(bookings).toHaveAccessibleDescription(
    '120 ungelesene Benachrichtigungen zu deinen Anfragen.',
  );
  await expect(nav.getByRole('link', { name: 'Nachrichten', exact: true })).toHaveText(
    'Nachrichten',
  );
});

test('reading one booking event updates the count without reading other events', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/notifications.html');
  const nav = page.getByRole('navigation', { name: 'Hauptnavigation', exact: true });
  const bookings = nav.getByRole('link', { name: 'Anfragen', exact: true });
  await expect(bookings).toContainText('2');
  await expect(page.getByRole('link', { name: 'Anfrage öffnen →' }).first()).toHaveAttribute(
    'href',
    '/account/bookings/incoming#booking-20000000-0000-4000-8000-000000000001',
  );
  await expect(page.getByRole('link', { name: 'Anfrage öffnen →' }).last()).toHaveAttribute(
    'href',
    '/account/bookings/my-rentals#booking-20000000-0000-4000-8000-000000000002',
  );
  await page
    .getByRole('button', { name: 'Neue Mietanfrage: als gelesen markieren', exact: true })
    .click();
  await expect(bookings).toContainText('1');
  await expect(page.getByText('Neu', { exact: true })).toHaveCount(1);
  await page
    .getByRole('button', {
      name: 'Deine Anfrage wurde bestätigt: als gelesen markieren',
      exact: true,
    })
    .click();
  await expect(bookings).toHaveText('Anfragen');
  await expect(page.getByText('Alles gelesen.', { exact: true })).toBeVisible();
});

test('read errors preserve the unread state; missing backend is not presented as an empty inbox', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/notifications.html?state=read-error');
  await page
    .getByRole('button', { name: 'Neue Mietanfrage: als gelesen markieren', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('Lesestatus konnte nicht gespeichert werden');
  await expect(page.getByText('Neu', { exact: true })).toHaveCount(2);
  await page.goto('/tests/fixtures/notifications.html?state=unavailable');
  await expect(page.getByText(/Benachrichtigungen werden gerade eingerichtet/)).toBeVisible();
  await expect(page.getByText('Alles gelesen.', { exact: true })).toHaveCount(0);
});

for (const width of [320, 390, 768, 1440]) {
  test(`booking indicators and notification list fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/tests/fixtures/notifications.html');
    await expect(
      page.getByRole('heading', { name: 'Benachrichtigungen', exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width < 1024) {
      await expect(
        page
          .getByRole('navigation', { name: 'Mobile Navigation', exact: true })
          .getByRole('link', { name: 'Anfragen', exact: true }),
      ).toContainText('2');
      await page.getByRole('button', { name: 'Menü öffnen', exact: true }).click();
      await expect(
        page
          .getByRole('navigation', { name: 'Menü', exact: true })
          .getByRole('link', { name: 'Anfragen', exact: true }),
      ).toContainText('2');
    }
  });
}
