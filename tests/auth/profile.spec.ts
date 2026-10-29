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

test('real Clerk sessions persist profiles and isolate two accounts across sign-out', async ({
  page,
}) => {
  await page.goto('/');
  await clerk.loaded({ page });
  await page.goto('/account/profile');
  await expect(page.getByRole('heading', { name: 'Bitte melde dich an' })).toBeVisible();

  await clerk.signIn({ page, emailAddress: ownerEmail });
  await page.goto('/account/profile');
  await expect(page.getByLabel('E-Mail-Adresse', { exact: true })).toHaveValue(ownerEmail);
  await page.getByLabel('Name', { exact: true }).fill('Owner Profile');
  await page.getByLabel('Stadt', { exact: true }).fill('Berlin');
  await page.getByLabel('Telefonnummer', { exact: true }).fill('+4912345678');
  await page.getByRole('button', { name: 'Änderungen speichern' }).click();
  await expect(page.getByRole('status')).toHaveText('Dein Profil wurde gespeichert.');
  await page.reload();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Owner Profile');
  await expect(page.getByLabel('Stadt', { exact: true })).toHaveValue('Berlin');
  const owner = await currentUser(page);
  expect(owner.status).toBe(200);
  expect(owner.body.user.id).toMatch(/^[0-9a-f-]{36}$/i);
  expect(owner.body.user).not.toHaveProperty('clerkUserId');

  await clerk.signOut({ page });
  await page.goto('/account/profile');
  await expect(page.getByRole('heading', { name: 'Bitte melde dich an' })).toBeVisible();
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
  await expect(page.getByRole('status')).toHaveText('Dein Profil wurde gespeichert.');
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
