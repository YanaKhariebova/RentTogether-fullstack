import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  envDir: false,
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify('/__i18n-test-api') },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../../src', import.meta.url)),
      '@clerk/react': fileURLToPath(new URL('./clerk.fixture.ts', import.meta.url)),
    },
  },
  plugins: [react()],
  server: { host: '127.0.0.1', port: 4194, strictPort: true },
});
