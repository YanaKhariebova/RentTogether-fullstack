import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/i18n',
  testMatch: '**/*.spec.ts',
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:4194',
    channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome',
    locale: 'de-DE',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --config tests/i18n/vite.config.ts',
    url: 'http://127.0.0.1:4194/tests/i18n/index.html',
    reuseExistingServer: !process.env.CI,
  },
});
