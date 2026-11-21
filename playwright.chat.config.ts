import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/chat',
  testMatch: '**/*.spec.ts',
  workers: 1,
  retries: 0,
  use: {
    locale: 'de-DE',
    baseURL: 'http://127.0.0.1:4193',
    channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --config tests/chat/vite.config.ts',
    url: 'http://127.0.0.1:4193/tests/chat/index.html',
    reuseExistingServer: !process.env.CI,
  },
});
