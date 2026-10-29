import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

for (const file of ['server/.env', '.env.local']) {
  if (existsSync(file)) process.loadEnvFile(file);
}
const frontend = new URL(process.env.CLIENT_URL ?? 'http://localhost:5173');
const api = new URL(process.env.VITE_API_URL ?? 'http://localhost:3000/api');
for (const url of [frontend, api, new URL(process.env.DATABASE_URL ?? 'http://invalid')]) {
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('Auth integration checks require local frontend, API and PostgreSQL.');
  }
}
if (
  !process.env.CLERK_SECRET_KEY?.startsWith('sk_test_') ||
  !process.env.CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_')
) {
  throw new Error('Development Clerk keys are required in server/.env.');
}
if (process.env.VITE_CLERK_PUBLISHABLE_KEY !== process.env.CLERK_PUBLISHABLE_KEY) {
  throw new Error('Frontend and backend must use the same Clerk instance.');
}

export default defineConfig({
  testDir: './tests/auth',
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: frontend.origin,
    channel: process.env.PLAYWRIGHT_CHANNEL ?? 'msedge',
    trace: 'off',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npm --prefix server run dev',
      url: `${api.origin}/api/health`,
      reuseExistingServer: true,
    },
    {
      command: `npm run dev -- --host ${frontend.hostname} --port ${frontend.port || 5173} --strictPort`,
      url: frontend.origin,
      reuseExistingServer: true,
    },
  ],
});
