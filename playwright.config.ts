import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';
for (const file of ['server/.env', '.env.local']) {
  if (existsSync(file)) process.loadEnvFile(file);
}
const frontend = new URL(process.env.CLIENT_URL ?? 'http://localhost:5173');
if (!['localhost', '127.0.0.1', '[::1]'].includes(frontend.hostname)) {
  throw new Error('UI checks require a local frontend.');
}
export default defineConfig({
  testDir: './tests/ui',
  // One Vite instance serves fixture pages and app routes. Running browser tests
  // serially avoids intermittent connection resets while that server is rebuilding.
  workers: 1,
  use: {
    locale: 'de-DE',
    baseURL: frontend.origin,
    channel: process.env.PLAYWRIGHT_CHANNEL,
  },
  webServer: {
    command: `npm run dev -- --host ${frontend.hostname} --port ${frontend.port || 5173} --strictPort`,
    url: frontend.origin,
    reuseExistingServer: !process.env.CI,
  },
});
