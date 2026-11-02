import { randomBytes, randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { createPrisma } from '../../server/src/lib/prisma';
import { configureImageStorage } from '../../server/src/modules/items/storage/configureImageStorage';
import { flushImageCleanup } from '../../server/src/modules/items/imageCleanup';

const runId = randomUUID();
const emails = [
  `rt-items-owner-${runId}+clerk_test@example.com`,
  `rt-items-other-${runId}+clerk_test@example.com`,
];
const createdUsers: string[] = [];
const apiUrl = process.env.VITE_API_URL ?? 'http://localhost:3000/api';
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEElEQVQImWNgaGDAjoaWBACBfCABOwg9uwAAAABJRU5ErkJggg==',
  'base64',
);
async function clerkApi(path: string, method = 'GET', body?: object) {
  const response = await fetch(`https://api.clerk.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new Error(`Clerk items check failed (status ${response.status}).`);
  return response.json();
}

test.beforeAll(async () => {
  if ((await clerkApi('/instance')).environment_type !== 'development')
    throw new Error('Development Clerk is required.');
  await clerkSetup();
  for (const email of emails) {
    const user = await clerkApi('/users', 'POST', {
      email_address: [email],
      first_name: 'Items Test',
      password: `Rt!${randomBytes(24).toString('hex')}`,
      private_metadata: { rentTogetherTestRun: runId },
    });
    createdUsers.push(user.id);
  }
});

test.afterAll(async () => {
  const prisma = createPrisma();
  const failures: unknown[] = [];
  try {
    const { imageStorage: storage } = configureImageStorage(process.env);
    // Только объекты пользователей, созданных именно этим тестом.
    const cleanupKeys: string[] = [];
    await prisma.$transaction(async (tx) => {
      const images = await tx.itemImage.findMany({
        where: { item: { owner: { clerkUserId: { in: createdUsers } } } },
      });
      for (const image of images)
        if (image.storageKey) {
          cleanupKeys.push(image.storageKey);
          await tx.imageCleanup.upsert({
            where: { storageKey: image.storageKey },
            create: { storageKey: image.storageKey },
            update: {},
          });
        }
      await tx.booking.deleteMany({
        where: {
          OR: [
            { renter: { clerkUserId: { in: createdUsers } } },
            { item: { owner: { clerkUserId: { in: createdUsers } } } },
          ],
        },
      });
      await tx.item.deleteMany({ where: { owner: { clerkUserId: { in: createdUsers } } } });
      await tx.user.deleteMany({ where: { clerkUserId: { in: createdUsers } } });
    });
    for (const key of cleanupKeys) await flushImageCleanup(prisma, storage, key);
    expect(await prisma.imageCleanup.count({ where: { storageKey: { in: cleanupKeys } } })).toBe(0);
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
  if (failures.length) throw new Error('Temporary items test data cleanup failed.');
});

async function apiRequest(page: Page, path: string, method = 'GET', body?: object) {
  await clerk.loaded({ page });
  return page.evaluate(
    async ({ apiUrl, path, method, body }) => {
      const token = await (
        window as unknown as { Clerk: { session: { getToken: () => Promise<string | null> } } }
      ).Clerk.session.getToken();
      const response = await fetch(`${apiUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return { status: response.status, body: await response.json().catch(() => null) };
    },
    { apiUrl, path, method, body },
  );
}

async function savePreview(page: Page, create = false) {
  await page.getByRole('button', { name: 'Vorschau anzeigen', exact: true }).click();
  await page
    .getByRole('button', {
      name: create ? 'Anzeige speichern' : 'Änderungen speichern',
      exact: true,
    })
    .click();
  await expect(page.getByRole('heading', { name: 'Meine Anzeigen', exact: true })).toBeVisible();
}

test('real owner creates, reloads, publishes and edits photos; another account cannot change the item', async ({
  page,
}) => {
  await page.goto('/');
  await clerk.loaded({ page });
  await clerk.signIn({ page, emailAddress: emails[0] });
  await page.goto('/account/items');
  await expect(page.getByText('Hier ist Platz für deine erste Anzeige.')).toBeVisible();
  await page.getByRole('button', { name: '+ Neue Anzeige', exact: true }).click();
  await page.getByLabel('Titel *', { exact: true }).fill(`Test Beamer ${runId}`);
  await page
    .getByLabel('Beschreibung *', { exact: true })
    .fill('Beamer mit Kabel für einen Testfilmabend.');
  await page.getByLabel('Ort *', { exact: true }).fill('Berlin');
  await page.getByLabel('Kategorie *', { exact: true }).selectOption({ label: 'Elektronik' });
  await page.getByLabel('Preis pro Tag', { exact: false }).fill('15,50');
  await page.getByLabel('Fotos auswählen', { exact: true }).setInputFiles([
    { name: 'first.png', mimeType: 'image/png', buffer: png },
    { name: 'second.png', mimeType: 'image/png', buffer: png },
  ]);
  await savePreview(page, true);
  const first = (await apiRequest(page, '/my/items')).body.items[0];
  expect(first.pricePerDay).toBe('15.50');
  expect(first.images).toHaveLength(2);
  expect(first.isPublished).toBe(false);
  if (process.env.IMAGE_STORAGE === 'cloudinary') {
    expect(
      first.images.every((image: { url: string }) =>
        image.url.startsWith('https://res.cloudinary.com/'),
      ),
    ).toBe(true);
  }
  await page.reload();
  await expect(
    page.getByRole('heading', { name: `Test Beamer ${runId}`, exact: true }),
  ).toBeVisible();
  expect((await page.request.get(first.images[0].url)).status()).toBe(200);
  await page
    .getByRole('button', { name: `Test Beamer ${runId} veröffentlichen`, exact: true })
    .click();
  await expect(
    page.getByText('Deine Anzeige wurde veröffentlicht.', { exact: true }),
  ).toBeVisible();
  const favoriteHeart = page.getByRole('button', {
    name: `Test Beamer ${runId} zu Favoriten hinzufügen`,
    exact: true,
  });
  await expect(favoriteHeart).toBeEnabled();
  await favoriteHeart.click();
  await expect(
    page.getByRole('button', { name: `Test Beamer ${runId} aus Favoriten entfernen`, exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(
    page.getByRole('button', { name: `Test Beamer ${runId} aus Favoriten entfernen`, exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(
    (await apiRequest(page, '/me/favorites')).body.items.some(
      (entry: { id: string }) => entry.id === first.id,
    ),
  ).toBe(true);
  await page.goto('/catalog');
  await page.getByRole('searchbox', { name: 'Wonach suchst du?' }).fill(runId);
  await expect(
    page.getByRole('heading', { name: `Test Beamer ${runId}`, exact: true }),
  ).toBeVisible();
  await page
    .getByRole('link')
    .filter({ has: page.getByRole('heading', { name: `Test Beamer ${runId}`, exact: true }) })
    .click();
  await expect(
    page.getByRole('heading', { name: `Test Beamer ${runId}`, exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Foto 2 anzeigen', exact: true })).toBeVisible();
  const removeFavorite = () =>
    page.getByRole('button', {
      name: `Test Beamer ${runId} aus Favoriten entfernen`,
      exact: true,
    });
  const addFavorite = () =>
    page.getByRole('button', {
      name: `Test Beamer ${runId} zu Favoriten hinzufügen`,
      exact: true,
    });
  const openNavigation = (name: string) =>
    page
      .getByRole('navigation', {
        name: 'Hauptnavigation',
        exact: true,
      })
      .getByRole('link', { name, exact: true })
      .click();

  // Keep the same SPA/cache: full reloads would hide stale cross-page state.
  await expect(removeFavorite()).toHaveAttribute('aria-pressed', 'true');
  await removeFavorite().click();
  await expect(addFavorite()).toHaveAttribute('aria-pressed', 'false');
  await openNavigation('Meine Anzeigen');
  await expect(addFavorite()).toHaveAttribute('aria-pressed', 'false');
  await expect(addFavorite()).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(addFavorite()).toHaveCSS('border-top-width', '0px');
  await addFavorite().click();
  await expect(removeFavorite()).toHaveAttribute('aria-pressed', 'true');
  await openNavigation('Favoriten');
  await expect(removeFavorite()).toHaveAttribute('aria-pressed', 'true');
  await removeFavorite().click();
  await expect(
    page.getByText('Du hast noch keine Favoriten gespeichert.', { exact: true }),
  ).toBeVisible();
  await openNavigation('Meine Anzeigen');
  await expect(addFavorite()).toHaveAttribute('aria-pressed', 'false');
  await addFavorite().click();
  await expect(removeFavorite()).toHaveAttribute('aria-pressed', 'true');
  await openNavigation('Entdecken');
  await page.getByRole('searchbox', { name: 'Wonach suchst du?' }).fill(runId);
  await expect(removeFavorite()).toHaveAttribute('aria-pressed', 'true');
  await removeFavorite().click();
  await expect(addFavorite()).toHaveAttribute('aria-pressed', 'false');
  await openNavigation('Meine Anzeigen');
  await expect(addFavorite()).toHaveAttribute('aria-pressed', 'false');
  await addFavorite().click();
  await expect(removeFavorite()).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: `Test Beamer ${runId} bearbeiten`, exact: true }).click();
  await page.getByLabel('Preis pro Tag', { exact: false }).fill('20,00');
  await page.getByRole('button', { name: 'Foto 2 nach vorne verschieben', exact: true }).click();
  await savePreview(page);
  let saved = (await apiRequest(page, '/my/items')).body.items[0];
  expect(saved.images.map((image: { id: string }) => image.id)).toEqual([
    first.images[1].id,
    first.images[0].id,
  ]);
  expect(saved.pricePerDay).toBe('20.00');
  expect(saved.isPublished).toBe(true);
  await page.reload();
  await page.getByRole('button', { name: `Test Beamer ${runId} bearbeiten`, exact: true }).click();
  await expect(page.getByRole('button', { name: 'Foto 2 entfernen', exact: true })).toHaveCSS(
    'background-color',
    'rgb(152, 75, 72)',
  );
  await page.getByRole('button', { name: 'Foto 2 entfernen', exact: true }).click();
  await page.getByLabel('Fotos auswählen', { exact: true }).setInputFiles({
    name: 'broken.png',
    mimeType: 'image/png',
    buffer: Buffer.from('broken image'),
  });
  await page.getByRole('button', { name: 'Vorschau anzeigen', exact: true }).click();
  await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('gültiges Foto');
  expect((await apiRequest(page, '/my/items')).body.items[0].isPublished).toBe(false);
  await page.getByRole('button', { name: 'Foto 2 entfernen', exact: true }).click();
  await savePreview(page);
  saved = (await apiRequest(page, '/my/items')).body.items[0];
  expect(saved.images).toHaveLength(1);
  const verification = createPrisma();
  try {
    expect(
      await verification.itemImage.findUnique({ where: { id: first.images[0].id } }),
    ).toBeNull();
  } finally {
    await verification.$disconnect();
  }
  // Cloudinary CDN может некоторое время отдавать уже удалённый файл из кеша.
  if (new URL(first.images[0].url).hostname !== 'res.cloudinary.com') {
    expect((await page.request.get(first.images[0].url)).status()).toBe(404);
  }

  await clerk.signOut({ page });
  await clerk.signIn({ page, emailAddress: emails[1] });
  await page.goto('/account/items');
  await expect(page.getByText('Hier ist Platz für deine erste Anzeige.')).toBeVisible();
  expect((await apiRequest(page, '/my/items')).body.items).toHaveLength(0);
  expect((await apiRequest(page, '/me/favorites')).body.items).toHaveLength(0);
  expect((await apiRequest(page, `/me/favorites/${first.id}`, 'DELETE')).status).toBe(204);
  for (const method of ['PATCH', 'DELETE']) {
    const denied = await apiRequest(
      page,
      `/items/${first.id}`,
      method,
      method === 'PATCH' ? { title: 'Forbidden title' } : undefined,
    );
    expect(denied.status).toBe(403);
  }
  await page.goto(`/account/items/${first.id}/edit`);
  await expect(page.getByRole('heading', { name: 'Anzeige nicht gefunden' })).toBeVisible();
  await clerk.signOut({ page });
  await clerk.signIn({ page, emailAddress: emails[0] });
  await page.goto('/account/items');
  await page.getByRole('button', { name: `Test Beamer ${runId} ausblenden`, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Anzeige ausblenden?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Ausblenden', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Deine Anzeige wurde ausgeblendet.', { exact: true })).toBeVisible();
  await page.reload();
  expect((await apiRequest(page, '/my/items')).body.items[0].isPublished).toBe(false);
  expect((await apiRequest(page, '/my/items')).body.items[0].isFavorite).toBe(true);
  expect((await apiRequest(page, '/me/favorites')).body.items).toHaveLength(0);
  const hiddenFavorite = page.getByRole('button', {
    name: `Test Beamer ${runId} aus Favoriten entfernen`,
    exact: true,
  });
  await expect(hiddenFavorite).toBeEnabled();
  await hiddenFavorite.click();
  await expect(
    page.getByRole('button', {
      name: `Test Beamer ${runId}: Zum Favorisieren zuerst veröffentlichen.`,
      exact: true,
    }),
  ).toHaveAttribute('aria-pressed', 'false');
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.goto('/catalog');
  await page.getByRole('searchbox', { name: 'Wonach suchst du?' }).fill(runId);
  await expect(page.getByText('Keine passenden Anzeigen gefunden.')).toBeVisible();
  await page.goto('/account/items');
  const deleteButton = page.getByRole('button', {
    name: `Test Beamer ${runId} löschen`,
    exact: true,
  });
  await expect(deleteButton).toHaveCSS('background-color', 'rgb(152, 75, 72)');
  await deleteButton.focus();
  await deleteButton.press('Enter');
  const deleteDialog = page.getByRole('dialog', { name: 'Anzeige endgültig löschen?' });
  await expect(deleteDialog.getByRole('button', { name: 'Abbrechen', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(deleteDialog).toBeHidden();
  await expect(deleteButton).toBeFocused();
  await deleteButton.click();
  await deleteDialog.getByRole('button', { name: 'Endgültig löschen', exact: true }).click();
  await expect(deleteDialog).toBeHidden();
  await expect(page.getByText('Hier ist Platz für deine erste Anzeige.')).toBeVisible();
  await page.reload();
  expect((await apiRequest(page, '/my/items')).body.items).toHaveLength(0);
  await clerk.signOut({ page });
  await page.goto('/account/items');
  await expect(page.getByRole('heading', { name: 'Bitte melde dich an' })).toBeVisible();
});

test('two real accounts book a published item, preserve snapshot after edit and hide, and complete the rental', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const title = `Booking Beamer ${runId}`;
  await page.goto('/');
  await clerk.loaded({ page });
  await clerk.signIn({ page, emailAddress: emails[0] });
  await page.goto('/account/items/new');
  await page.getByLabel('Titel *', { exact: true }).fill(title);
  await page
    .getByLabel('Beschreibung *', { exact: true })
    .fill('Beamer für einen gemeinsamen Filmabend mit den Nachbarn.');
  await page.getByLabel('Ort *', { exact: true }).fill('Berlin');
  await page.getByLabel('Kategorie *', { exact: true }).selectOption({ label: 'Elektronik' });
  await page.getByLabel('Preis pro Tag', { exact: false }).fill('15,50');
  await page
    .getByLabel('Fotos auswählen', { exact: true })
    .setInputFiles({ name: 'booking.png', mimeType: 'image/png', buffer: png });
  await savePreview(page, true);
  const item = (await apiRequest(page, '/my/items')).body.items.find(
    (entry: { title: string }) => entry.title === title,
  );
  await page.getByRole('button', { name: `${title} veröffentlichen`, exact: true }).click();
  await expect(
    page.getByText('Deine Anzeige wurde veröffentlicht.', { exact: true }),
  ).toBeVisible();
  await clerk.signOut({ page });
  await clerk.signIn({ page, emailAddress: emails[1] });
  await page.goto(`/items/${item.id}`);
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1, 10);
  const month = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
  await page.getByRole('button', { name: 'Zum nächsten Monat', exact: true }).click();
  await page.locator(`[data-day="${month}-10"]:not([data-outside]) button`).click();
  await page.locator(`[data-day="${month}-13"]:not([data-outside]) button`).click();
  await page.getByRole('button', { name: 'Anfrage senden', exact: true }).click();
  await expect(page.getByText('Deine Anfrage wurde gesendet.', { exact: true })).toBeVisible();
  await page.goto('/account/bookings/my-rentals');
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(page.getByText('Ausstehend', { exact: true })).toBeVisible();
  const booking = (await apiRequest(page, '/bookings/my-rentals')).body.bookings.find(
    (entry: { itemId: string }) => entry.itemId === item.id,
  );
  expect(booking.totalPrice).toBe('46.50');
  await clerk.signOut({ page });
  await clerk.signIn({ page, emailAddress: emails[0] });
  await page.goto(`/account/items/${item.id}/edit`);
  await page.getByLabel('Preis pro Tag', { exact: false }).fill('20,00');
  await savePreview(page);
  await page.getByRole('button', { name: `${title} ausblenden`, exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Anzeige ausblenden?' })
    .getByRole('button', { name: 'Ausblenden', exact: true })
    .click();
  await expect(page.getByText('Deine Anzeige wurde ausgeblendet.', { exact: true })).toBeVisible();
  await page.goto('/account/bookings/incoming');
  const card = page
    .locator('li')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) });
  await expect(card).toContainText('46,50');
  await card.getByRole('button', { name: 'Annehmen', exact: true }).click();
  await expect(card.getByText('Bestätigt', { exact: true })).toBeVisible();
  await card.getByRole('button', { name: 'Übergabe starten', exact: true }).click();
  await expect(card.getByText('Aktiv', { exact: true })).toBeVisible();
  await card.getByRole('button', { name: 'Abschließen', exact: true }).click();
  await expect(card.getByText('Abgeschlossen', { exact: true })).toBeVisible();
  await page.reload();
  await expect(card.getByText('Abgeschlossen', { exact: true })).toBeVisible();
  await clerk.signOut({ page });
  await clerk.signIn({ page, emailAddress: emails[1] });
  await page.goto('/account/bookings/my-rentals');
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(page.getByText('Abgeschlossen', { exact: true })).toBeVisible();
  const preserved = (await apiRequest(page, '/bookings/my-rentals')).body.bookings.find(
    (entry: { id: string }) => entry.id === booking.id,
  );
  expect(preserved.pricePerDay).toBe('15.50');
  expect(preserved.totalPrice).toBe('46.50');
  await clerk.signOut({ page });
});
