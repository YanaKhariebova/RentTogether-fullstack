import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { tanstackRouter } from '@tanstack/router-vite-plugin';
import { fileURLToPath } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react()],
});
