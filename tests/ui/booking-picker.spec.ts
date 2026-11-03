import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
async function selectDates(page: Page, from: string, to: string) {
  await page.getByRole('button', { name: /Zeitraum (auswählen|ändern)/ }).click();
  await page.getByRole('button', { name: 'Zum nächsten Monat', exact: true }).click();
  await page.locator('[data-day="' + from + '"]:not([data-outside]) button').click();
  await page.locator('[data-day="' + to + '"]:not([data-outside]) button').click();
}
function month() {
  const next = new Date();
  next.setMonth(next.getMonth() + 1, 10);
  return next.getFullYear() + '-' + String(next.getMonth() + 1).padStart(2, '0');
}
test('successful range cannot be resent; new dates enable sending, old dates stay sent', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/booking-picker.html');
  const value = month();
  await selectDates(page, value + '-10', value + '-13');
  await page.getByRole('button', { name: 'Anfrage senden', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Anfrage gesendet', exact: true })).toBeDisabled();
  await expect(page.getByLabel('Sendeversuche')).toHaveText('1');
  await selectDates(page, value + '-15', value + '-18');
  await expect(page.getByRole('button', { name: 'Anfrage senden', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Anfrage senden', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Anfrage gesendet', exact: true })).toBeDisabled();
  await selectDates(page, value + '-10', value + '-13');
  await expect(page.getByRole('button', { name: 'Anfrage gesendet', exact: true })).toBeDisabled();
  await expect(page.getByLabel('Sendeversuche')).toHaveText('2');
});
test('failed submission stays retryable', async ({ page }) => {
  await page.goto('/tests/fixtures/booking-picker.html?fail');
  const value = month();
  await selectDates(page, value + '-10', value + '-13');
  await page.getByRole('button', { name: 'Anfrage senden', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Bitte erneut versuchen.');
  await expect(page.getByRole('button', { name: 'Anfrage senden', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Anfrage gesendet', exact: true })).toHaveCount(0);
});
