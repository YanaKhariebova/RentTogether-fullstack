import react from '@vitejs/plugin-react';
import { chatEventsFixture } from './events.fixture.ts';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // Do not load real API URLs or credentials into this test fixture.
  envDir: false,
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify('/__chat-test-api') },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../../src', import.meta.url)),
      '@clerk/react': fileURLToPath(new URL('./clerk.fixture.ts', import.meta.url)),
    },
  },
  plugins: [react(), chatEventsFixture()],
  server: { host: '127.0.0.1', port: 4193, strictPort: true },
});
