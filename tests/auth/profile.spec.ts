import { randomUUID, randomBytes } from 'node:crypto';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { createPrisma } from '../../server/src/lib/prisma';

const runId = randomUUID();
const ownerEmail = `rt-owner-${runId}+clerk_test@example.com`;
const renterEmail = `rt-renter-${runId}+clerk_test@example.com`;
const createdUsers: string[] = [];
const apiUrl = process.env.VITE_API_URL ?? 'http://localhost:3000/api';

async function clerkApi(path: string, method = 'GET', body?: object) {
  const response = await fetch(`https://api.clerk.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok)
    throw new Error(`Clerk test request failed (${method} ${path}, status ${response.status}).`);
  return response.json();
}

test.beforeAll(async () => {
  const instance = await clerkApi('/instance');
  if (instance.environment_type !== 'development')
    throw new Error('Temporary test users are allowed only in a Development instance.');
  await clerkSetup();
  for (const [email, name] of [
    [ownerEmail, 'Test Owner'],
    [renterEmail, 'Test Renter'],
  ]) {
    const user = await clerkApi('/users', 'POST', {
      email_address: [email],
      first_name: name,
      password: `Rt!${randomBytes(24).toString('hex')}`,
      private_metadata: { rentTogetherTestRun: runId },
    });
    createdUsers.push(user.id);
  }
});

test.afterAll(async () => {
  const failures: unknown[] = [];
  if (createdUsers.length) {
    const prisma = createPrisma();
    try {
      await prisma.user.deleteMany({ where: { clerkUserId: { in: createdUsers } } });
    } catch (error) {
      failures.push(error);
    } finally {
      await prisma.$disconnect();
    }
    for (const id of createdUsers) {
      try {
        await clerkApi(`/users/${id}`, 'DELETE');
      } catch (error) {
        failures.push(error);
      }
    }
  }
  if (failures.length)
    throw new Error('Temporary auth test data cleanup failed. Check the test run before retrying.');
});

async function currentUser(page: Page) {
  return page.evaluate(async (base) => {
    const provider = (
      window as unknown as { Clerk: { session: { getToken: () => Promise<string | null> } } }
    ).Clerk;
    const token = await provider.session.getToken();
    const response = await fetch(`${base}/me`, { headers: { Authorization: `Bearer ${token}` } });
    return { status: response.status, body: await response.json() };
  }, apiUrl);
}

test('guest access is blocked on every account entry point', async ({ page }) => {
  await page.goto('/');
  await clerk.loaded({ page });
  for (const path of [
    '/account',
    '/account/profile',
    '/account/items',
    '/account/items/new',
    '/account/items/20000000-0000-4000-8000-000000000001/edit',
    '/account/favorites',
    '/account/bookings',
    '/account/bookings/my-rentals',
    '/account/bookings/incoming',
    '/account/messages',
  ]) {
    await page.goto(path);
    const title = path.startsWith('/account/favorites')
      ? 'Deine Favoriten warten auf dich'
      : path.startsWith('/account/bookings')
        ? 'Deine Anfragen warten auf dich'
        : path.startsWith('/account/messages')
          ? 'Bleib mit deiner Nachbarschaft in Kontakt'
          : 'Melde dich an, um weiterzumachen';
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Jetzt anmelden', exact: true }),
    ).toHaveAttribute('href', '/sign-in');
    await expect(page.getByRole('main').locator('input')).toHaveCount(0);
  }
});

test('hosted sign-in and sign-up forms fit phones and desktop in both themes', async ({ page }) => {
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['dark', 'light']) {
      await page.goto('/');
      await page.evaluate((value) => localStorage.setItem('renttogether-theme', value), theme);
      for (const path of ['/sign-in', '/sign-up']) {
        await page.goto(path);
        await expect(
          page.getByRole('main').getByLabel('E-Mail-Adresse', { exact: true }),
        ).toBeVisible();
        await expect(page.getByRole('main').getByLabel('Passwort', { exact: true })).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
      }
    }
  }
});

test('incoming requests do not depend on the renter name and failed actions show errors', async ({
  page,
}) => {
  await page.goto('/');
  await clerk.loaded({ page });
  await clerk.signIn({ page, emailAddress: ownerEmail });
  const booking = {
    id: '10000000-0000-4000-8000-000000000001',
    itemId: '20000000-0000-4000-8000-000000000001',
    itemTitle: 'Audit Anfrage',
    renterName: 'Du',
    status: 'PENDING',
    pickupDate: '2030-01-10',
    returnDate: '2030-01-13',
    pricePerDay: '15.50',
    totalPrice: '46.50',
  };
  let failed = true;
  await page.route('**/api/bookings/incoming', (route) =>
    route.fulfill(
      failed
        ? {
            status: 503,
            json: { error: { code: 'UNAVAILABLE', message: 'Nicht verfügbar.', fields: {} } },
          }
        : { json: { bookings: [booking] } },
    ),
  );
  await page.route(`**/api/bookings/${booking.id}/status`, (route) =>
    route.fulfill({
      status: 409,
      json: {
        error: {
          code: 'BOOKING_DATES_UNAVAILABLE',
          message: 'Dieser Zeitraum ist nicht mehr verfügbar.',
          fields: {},
        },
      },
    }),
  );
  await page.goto('/account/bookings/incoming');
  await expect(page.getByRole('alert')).toContainText('Buchungen konnten nicht geladen werden.');
  failed = false;
  await page.getByRole('button', { name: 'Erneut versuchen', exact: true }).click();
  await expect(page.getByRole('heading', { name: booking.itemTitle })).toBeVisible();
  await page.getByRole('button', { name: 'Annehmen', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Dieser Zeitraum ist nicht mehr verfügbar.');
  await expect(page.getByText('Ausstehend', { exact: true })).toBeVisible();
});

test('booking failures are visible and a successful retry refreshes cached rentals', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await clerk.loaded({ page });
  await clerk.signIn({ page, emailAddress: ownerEmail });
  const item = {
    id: '20000000-0000-4000-8000-000000000001',
    title: 'Audit Beamer',
    description: 'Testanzeige',
    pricePerDay: '15.50',
    city: 'Berlin',
    isPublished: true,
    category: { id: '30000000-0000-4000-8000-000000000001', name: 'Elektronik' },
    owner: { id: '40000000-0000-4000-8000-000000000001', name: 'Olga', city: 'Berlin' },
    images: [
      { id: '50000000-0000-4000-8000-000000000001', url: '/media/hero-mobile-640.webp', order: 0 },
    ],
  };
  await page.route(`**/api/items/${item.id}`, (route) => route.fulfill({ json: { item } }));
  await page.route('**/api/bookings/items/*/unavailable-dates', (route) =>
    route.fulfill({ json: { ranges: [] } }),
  );
  await page.route('**/api/me/favorites', (route) => route.fulfill({ json: { items: [] } }));
  await page.route(`**/api/me/favorites/${item.id}`, (route) =>
    route.fulfill({
      status: 503,
      json: { error: { code: 'UNAVAILABLE', message: 'Speichern fehlgeschlagen.', fields: {} } },
    }),
  );
  let rejectBooking = true;
  let booked = false;
  await page.route('**/api/bookings/my-rentals', (route) =>
    route.fulfill({
      json: {
        bookings: booked
          ? [
              {
                id: '60000000-0000-4000-8000-000000000001',
                itemId: item.id,
                itemTitle: item.title,
                renterName: 'Du',
                status: 'PENDING',
                pickupDate: '2030-01-10',
                returnDate: '2030-01-13',
                pricePerDay: '15.50',
                totalPrice: '46.50',
              },
            ]
          : [],
      },
    }),
  );
  await page.route('**/api/bookings', (route) => {
    if (rejectBooking)
      return route.fulfill({
        status: 409,
        json: {
          error: {
            code: 'BOOKING_DATES_UNAVAILABLE',
            message: 'Dieser Zeitraum ist nicht mehr verfügbar.',
            fields: {},
          },
        },
      });
    booked = true;
    return route.fulfill({
      json: {
        booking: {
          id: '60000000-0000-4000-8000-000000000001',
          status: 'PENDING',
          totalPrice: '46.50',
        },
      },
    });
  });
  await page.route('**/api/categories', (route) =>
    route.fulfill({ json: { categories: [item.category] } }),
  );
  await page.route('**/api/items/cities', (route) =>
    route.fulfill({ json: { cities: ['Berlin'] } }),
  );
  await page.route('**/api/items?**', (route) =>
    route.fulfill({
      json: {
        items: [item],
        pagination: { page: 1, limit: 9, total: 1, totalPages: 1 },
      },
    }),
  );
  await page.goto('/account/bookings/my-rentals');
  await expect(page.getByText('Noch keine Buchungen vorhanden.')).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('link', { name: 'Entdecken', exact: true })
    .click();
  await page.getByRole('link', { name: item.title }).click();
  await page
    .getByRole('button', { name: `${item.title} zu Favoriten hinzufügen`, exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText(
    'Favoriten konnten nicht gespeichert werden.',
  );
  const date = new Date();
  date.setMonth(date.getMonth() + 1, 10);
  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  await page.getByRole('button', { name: 'Zeitraum auswählen', exact: true }).click();
  await page.getByRole('button', { name: 'Zum nächsten Monat', exact: true }).click();
  await page.locator(`[data-day="${month}-10"]:not([data-outside]) button`).click();
  await page.locator(`[data-day="${month}-13"]:not([data-outside]) button`).click();
  await page.getByRole('button', { name: 'Anfrage senden', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Dieser Zeitraum ist nicht mehr verfügbar.' }),
  ).toBeVisible();
  rejectBooking = false;
  await page.getByRole('button', { name: 'Anfrage senden', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Anfrage gesendet' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Anfrage gesendet', exact: true })).toBeDisabled();
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('link', { name: 'Anfragen', exact: true })
    .click();
  await page
    .getByRole('navigation', { name: 'Buchungen' })
    .getByRole('link', { name: 'Meine Mieten', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: item.title, exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('mobile authenticated profile, favorites and booking views fit both themes', async ({
  page,
}) => {
  test.setTimeout(240_000);
  await page.goto('/');
  await clerk.loaded({ page });
  await clerk.signIn({ page, emailAddress: ownerEmail });
  for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const theme of ['dark', 'light']) {
      await page.evaluate((value) => {
        localStorage.setItem('renttogether-theme', value);
      }, theme);
      for (const [path, heading] of [
        ['/account/profile', 'Mein Profil'],
        ['/account/favorites', 'Favoriten'],
        ['/account/bookings/my-rentals', 'Meine Mieten'],
        ['/account/bookings/incoming', 'Eingehende Anfragen'],
      ]) {
        await page.goto(path);
        await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        if (path === '/account/profile') {
          await expect(page.getByLabel('Name', { exact: true })).toBeVisible();
          await page.getByLabel('Telefonnummer', { exact: true }).focus();
          if (width < 1024)
            await expect(page.getByRole('navigation', { name: 'Mobile Navigation' })).toBeHidden();
        } else if (path === '/account/favorites') {
          await expect(page.getByText('Du hast noch keine Favoriten gespeichert.')).toBeVisible();
        } else {
          await expect(page.getByText('Noch keine Buchungen vorhanden.')).toBeVisible();
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Menü öffnen' }).click();
  await expect(
    page.getByRole('dialog').getByRole('link', { name: 'Profil öffnen', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
  await expect(page).toHaveURL('/');
  await page.getByRole('button', { name: 'Menü öffnen' }).click();
  await expect(
    page.getByRole('dialog').getByRole('link', { name: 'Anmelden', exact: true }),
  ).toBeVisible();
});

test('real Clerk sessions persist profiles and isolate two accounts across sign-out', async ({
  page,
}) => {
  await page.goto('/');
  await clerk.loaded({ page });
  await page.goto('/account/profile');
  await expect(
    page.getByRole('heading', { name: 'Melde dich an, um weiterzumachen' }),
  ).toBeVisible();

  await clerk.signIn({ page, emailAddress: ownerEmail });
  await page.goto('/account/profile');
  await expect(page.getByLabel('E-Mail-Adresse', { exact: true })).toHaveValue(ownerEmail);
  await page.getByLabel('Name', { exact: true }).fill('Owner Profile');
  await page.getByLabel('Stadt', { exact: true }).fill('Berlin');
  await page.getByLabel('Telefonnummer', { exact: true }).fill('+4912345678');
  await page.getByRole('button', { name: 'Änderungen speichern' }).click();
  await expect(page.getByText('Dein Profil wurde gespeichert.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Owner Profile');
  await expect(page.getByLabel('Stadt', { exact: true })).toHaveValue('Berlin');
  const owner = await currentUser(page);
  expect(owner.status).toBe(200);
  expect(owner.body.user.id).toMatch(/^[0-9a-f-]{36}$/i);
  expect(owner.body.user).not.toHaveProperty('clerkUserId');
  const clerkAvatar = await page.evaluate(
    () => (window as unknown as { Clerk: { user: { imageUrl: string } } }).Clerk.user.imageUrl,
  );
  expect(owner.body.user.avatarUrl).toBe(clerkAvatar);

  await clerk.signOut({ page });
  await page.goto('/account/profile');
  await expect(
    page.getByRole('heading', { name: 'Melde dich an, um weiterzumachen' }),
  ).toBeVisible();
  await expect(page.getByLabel('Name', { exact: true })).toHaveCount(0);
  const anonymous = await page.request.get(`${apiUrl}/me`);
  expect(anonymous.status()).toBe(401);

  await clerk.signIn({ page, emailAddress: renterEmail });
  await page.goto('/account/profile');
  await expect(page.getByLabel('E-Mail-Adresse', { exact: true })).toHaveValue(renterEmail);
  await expect(page.getByLabel('Stadt', { exact: true })).toHaveValue('');
  await page.getByLabel('Name', { exact: true }).fill('Renter Profile');
  await page.getByLabel('Stadt', { exact: true }).fill('Hamburg');
  await page.getByRole('button', { name: 'Änderungen speichern' }).click();
  await expect(page.getByText('Dein Profil wurde gespeichert.', { exact: true })).toBeVisible();
  const renter = await currentUser(page);
  expect(renter.status).toBe(200);
  expect(renter.body.user.id).not.toBe(owner.body.user.id);

  await clerk.signOut({ page });
  await clerk.signIn({ page, emailAddress: ownerEmail });
  await page.goto('/account/profile');
  await expect(page.getByLabel('E-Mail-Adresse', { exact: true })).toHaveValue(ownerEmail);
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Owner Profile');
  await expect(page.getByLabel('Stadt', { exact: true })).toHaveValue('Berlin');
  await expect(page.getByLabel('Telefonnummer', { exact: true })).toHaveValue('+4912345678');
  await clerk.signOut({ page });
});

test('mobile account menu shows the real Clerk avatar, aligns theme beside logout and restores guest login', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await clerk.loaded({ page });
  await clerk.signIn({ page, emailAddress: ownerEmail });
  await page.goto('/account/profile');
  await expect(page.getByRole('heading', { name: 'Mein Profil', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Menü öffnen', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const avatar = dialog.getByRole('link', { name: 'Profil öffnen', exact: true });
  const image = avatar.locator('img');
  await expect(image).toBeVisible();
  const clerkImage = await page.evaluate(
    () => (window as unknown as { Clerk: { user: { imageUrl: string } } }).Clerk.user.imageUrl,
  );
  await expect(image).toHaveAttribute('src', clerkImage);
  await expect
    .poll(() => image.evaluate((img) => (img as HTMLImageElement).naturalWidth > 0))
    .toBe(true);
  await expect(image).toHaveCSS('border-radius', '50%');
  await expect(dialog.getByText('Darstellung', { exact: true })).toHaveCount(0);
  await expect(dialog.getByText('Mein Profil', { exact: true })).toHaveCount(0);
  const signOutBox = await dialog
    .getByRole('button', { name: 'Abmelden', exact: true })
    .boundingBox();
  const themeBox = await dialog.getByRole('button', { name: /Design aktivieren$/ }).boundingBox();
  expect(themeBox!.x).toBeGreaterThan(signOutBox!.x);
  expect(themeBox!.y).toBeCloseTo(signOutBox!.y, 0);
  await avatar.click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('button', { name: 'Menü öffnen', exact: true }).click();
  await dialog.getByRole('button', { name: 'Abmelden', exact: true }).click();
  await expect(page).toHaveURL('/');
  await page.getByRole('button', { name: 'Menü öffnen', exact: true }).click();
  await expect(dialog.getByRole('link', { name: 'Anmelden', exact: true })).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Profil öffnen', exact: true })).toHaveCount(0);
});
