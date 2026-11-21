import { expect, test, type Page } from '@playwright/test';

async function api(page: Page) {
  const state = {
    accounts: {
      owner: { preferredLocale: 'ru' as string | null },
      other: { preferredLocale: 'uk' as string | null },
    },
    writes: [] as { account: string; preferredLocale: string }[],
    saveFails: false,
    saveDelayMs: 0,
  };
  await page.route('**/__i18n-test-api/**', async (route) => {
    const request = route.request();
    const account = request.headers().authorization?.replace('Bearer ', '') ?? 'guest';
    const path = new URL(request.url()).pathname.replace('/__i18n-test-api', '');
    if (path === '/me') {
      if (!['owner', 'other'].includes(account))
        return route.fulfill({
          status: 401,
          json: { error: { code: 'UNAUTHENTICATED', message: 'Bitte melde dich an.', fields: {} } },
        });
      if (request.method() === 'PATCH') {
        if (state.saveDelayMs)
          await new Promise((resolve) => setTimeout(resolve, state.saveDelayMs));
        if (state.saveFails)
          return route.fulfill({
            status: 503,
            json: {
              error: { code: 'TEMPORARY', message: 'Die Anfrage ist fehlgeschlagen.', fields: {} },
            },
          });
        const preferredLocale = request.postDataJSON().preferredLocale;
        state.writes.push({ account, preferredLocale });
        state.accounts[account as 'owner' | 'other'].preferredLocale = preferredLocale;
      }
      return route.fulfill({
        json: {
          user: {
            id: account,
            name: 'Original name',
            email: `${account}@example.test`,
            phone: '',
            city: 'Berlin',
            avatarUrl: '',
            role: 'USER',
            preferredLocale: state.accounts[account as 'owner' | 'other'].preferredLocale,
          },
        },
      });
    }
    if (path === '/categories')
      return route.fulfill({ json: { categories: [{ id: 'tools', name: 'Werkzeug' }] } });
    if (path === '/items/cities') return route.fulfill({ json: { cities: ['Berlin'] } });
    if (path === '/items')
      return route.fulfill({
        json: { items: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } },
      });
    if (path === '/me/favorites') return route.fulfill({ json: { items: [] } });
    return route.fulfill({
      status: 404,
      json: {
        error: { code: 'NOT_FOUND', message: 'Die Seite wurde nicht gefunden.', fields: {} },
      },
    });
  });
  return state;
}
const picker = (page: Page) =>
  page.locator('button[data-language]').filter({ visible: true }).first();
const names: Record<string, string> = {
  de: 'Deutsch',
  en: 'English',
  uk: 'Українська',
  ru: 'Русский',
};
async function chooseLanguage(page: Page, language: string) {
  await picker(page).click();
  const dialog = page
    .getByRole('dialog')
    .filter({ has: page.locator('button[lang][aria-pressed]') });
  await expect(dialog).toBeVisible();
  expect(
    await dialog.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return (
        rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight
      );
    }),
  ).toBe(true);
  if (language === 'de' && test.info().title.includes('fit')) {
    const path = test.info().outputPath(`language-picker-${test.info().attachments.length}.png`);
    await dialog.screenshot({ path });
    await test.info().attach('language-picker', { path, contentType: 'image/png' });
  }
  await dialog.getByRole('button', { name: names[language], exact: true }).click();
  await expect(dialog).not.toBeVisible();
}
const open = (page: Page, account = 'guest') =>
  page.goto('/tests/i18n/index.html?account=' + account);

test('guest choice translates immediately, preserves a draft, persists after reload and never writes a profile', async ({
  page,
}) => {
  const state = await api(page);
  await open(page);
  await page.getByLabel('Test draft').fill('Mein Entwurf / мой текст');
  await chooseLanguage(page, 'en');
  await expect(
    page.getByRole('heading', { name: 'Rent what you need. Share what you have.' }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByLabel('Test draft')).toHaveValue('Mein Entwurf / мой текст');
  await page.reload();
  await expect(picker(page)).toHaveAttribute('data-language', 'en');
  expect(state.writes).toEqual([]);
});
test('browser language is used initially; unsupported browser languages fall back to German', async ({
  browser,
}) => {
  for (const [locale, expected] of [
    ['uk-UA', 'uk'],
    ['tr-TR', 'de'],
  ]) {
    const context = await browser.newContext({ locale });
    try {
      const page = await context.newPage();
      await api(page);
      await open(page);
      await expect(picker(page)).toHaveAttribute('data-language', expected);
    } finally {
      await context.close();
    }
  }
});
test('account preference overrides device choice and selected language survives a fresh device', async ({
  page,
  browser,
}) => {
  const state = await api(page);
  await page.addInitScript(() => localStorage.setItem('renttogether-language', 'en'));
  await open(page, 'owner');
  await expect(picker(page)).toHaveAttribute('data-language', 'ru');
  await chooseLanguage(page, 'uk');
  await expect.poll(() => state.accounts.owner.preferredLocale).toBe('uk');
  expect(state.writes).toEqual([{ account: 'owner', preferredLocale: 'uk' }]);
  // A new browser context has no device storage; use the same persisted server preference.
  const context = await browser.newContext({ locale: 'de-DE' });
  try {
    const device = await context.newPage();
    const second = await api(device);
    second.accounts.owner.preferredLocale = state.accounts.owner.preferredLocale;
    await open(device, 'owner');
    await expect(picker(device)).toHaveAttribute('data-language', 'uk');
  } finally {
    await context.close();
  }
});
test('switching accounts loads that account language and never saves the previous account choice to it', async ({
  page,
}) => {
  const state = await api(page);
  await open(page, 'owner');
  await expect(picker(page)).toHaveAttribute('data-language', 'ru');
  await page.evaluate(() => {
    (window as unknown as { languageTestAccount: string }).languageTestAccount = 'other';
    window.dispatchEvent(new Event('language-test-account'));
  });
  await expect(picker(page)).toHaveAttribute('data-language', 'uk');
  expect(state.writes).toEqual([]);
});
test('a failed profile save keeps the device language, shows an error and offers an explicit retry', async ({
  page,
}) => {
  const state = await api(page);
  await open(page, 'owner');
  await expect(picker(page)).toHaveAttribute('data-language', 'ru');
  state.saveFails = true;
  await chooseLanguage(page, 'en');
  await expect(page.getByRole('alert')).toContainText('could not be saved to your account');
  await expect(picker(page)).toHaveAttribute('data-language', 'en');
  expect(state.accounts.owner.preferredLocale).toBe('ru');
  state.saveFails = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect.poll(() => state.accounts.owner.preferredLocale).toBe('en');
  await expect(page.getByRole('alert')).toHaveCount(0);
});
test('category labels translate while the API filter still receives the category ID', async ({
  page,
}) => {
  await api(page);
  await open(page);
  await chooseLanguage(page, 'en');
  await page.locator('header').getByRole('link', { name: 'Explore', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Explore', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tools', exact: true })).toBeVisible();
  const request = page.waitForRequest(
    (request) => new URL(request.url()).searchParams.get('categoryId') === 'tools',
  );
  await page.getByRole('button', { name: 'Tools', exact: true }).click();
  expect(new URL((await request).url()).searchParams.get('categoryId')).toBe('tools');
});
for (const width of [320, 390, 768, 1024, 1440]) {
  test(`language picker and translated navigation fit ${width}px in both themes`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await api(page);
    await open(page);
    for (const theme of ['light', 'dark']) {
      for (const language of ['de', 'en', 'uk', 'ru']) {
        if (width < 1024) {
          // Keep a stable selector while the accessible menu label changes language.
          await page.locator('header button[aria-haspopup="dialog"]:not([data-language])').click();
          await expect(page.getByRole('dialog')).toBeVisible();
          await chooseLanguage(page, language);
          await expect(picker(page)).toHaveAttribute('data-language', language);
          const controls = page.getByRole('dialog').getByRole('button');
          // The first button is the close control; remaining settings stay in the dialog.
          await controls.first().click();
        } else {
          await chooseLanguage(page, language);
        }
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
          ),
        ).toBe(true);
      }
      if (theme === 'light') {
        if (width < 1024)
          await page.locator('header button[aria-haspopup="dialog"]:not([data-language])').click();
        await page
          .getByRole('button', { name: /Dunkles Design|dark theme|тёмную тему|темну тему/ })
          .filter({ visible: true })
          .click();
        if (width < 1024) await page.getByRole('dialog').getByRole('button').first().click();
      }
    }
  });
}

test('rapid language changes are saved in order and the last choice wins', async ({ page }) => {
  const state = await api(page);
  state.saveDelayMs = 100;
  await open(page, 'owner');
  await expect(picker(page)).toHaveAttribute('data-language', 'ru');
  await chooseLanguage(page, 'en');
  await chooseLanguage(page, 'ru');
  await chooseLanguage(page, 'uk');
  await expect.poll(() => state.accounts.owner.preferredLocale).toBe('uk');
  await expect(picker(page)).toHaveAttribute('data-language', 'uk');
  expect(state.writes.map((write) => write.preferredLocale)).toEqual(['en', 'ru', 'uk']);
});
test('language switching works when browser storage is blocked', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('Storage blocked');
      },
    }),
  );
  await api(page);
  await open(page);
  await chooseLanguage(page, 'uk');
  await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
  await expect(
    page.getByRole('heading', { name: 'Орендуйте потрібне. Діліться тим, що маєте.' }),
  ).toBeVisible();
});
test('a manual choice made while account settings are loading is not overwritten by the old response', async ({
  page,
}) => {
  const state = await api(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/__i18n-test-api/me', async (route) => {
    if (route.request().method() === 'PATCH') return route.fallback();
    await gate;
    await route.fulfill({
      json: {
        user: {
          id: 'owner',
          name: 'Original name',
          email: 'owner@example.test',
          phone: '',
          city: 'Berlin',
          avatarUrl: '',
          role: 'USER',
          preferredLocale: 'ru',
        },
      },
    });
  });
  await open(page, 'owner');
  await chooseLanguage(page, 'en');
  await expect.poll(() => state.accounts.owner.preferredLocale).toBe('en');
  const loaded = page.waitForResponse(
    (response) =>
      response.url().endsWith('/__i18n-test-api/me') && response.request().method() === 'GET',
  );
  release();
  await loaded;
  await expect(picker(page)).toHaveAttribute('data-language', 'en');
});

for (const mobile of [false, true]) {
  test(`language dialog supports Escape, keyboard choice and focus return (${mobile ? 'mobile' : 'desktop'})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: mobile ? 390 : 1440, height: 600 });
    await api(page);
    await open(page);
    if (mobile)
      await page.locator('header button[aria-haspopup="dialog"]:not([data-language])').click();
    await picker(page).click();
    const dialog = page
      .getByRole('dialog')
      .filter({ has: page.locator('button[lang][aria-pressed]') });
    await expect(dialog.getByRole('button', { name: 'Deutsch', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(picker(page)).toBeFocused();
    if (mobile) await expect(page.getByRole('dialog')).toBeVisible();
    await picker(page).press('Enter');
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'English', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(picker(page)).toBeFocused();
  });
}
