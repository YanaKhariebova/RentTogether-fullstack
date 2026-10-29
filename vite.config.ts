import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { tanstackRouter } from '@tanstack/router-vite-plugin';
import { fileURLToPath } from 'node:url';

// Dev использует тот же CLIENT_URL, что CORS и Clerk на backend.
export default defineConfig(({ command, mode }) => {
  const backendEnv =
    command === 'serve'
      ? loadEnv(mode, fileURLToPath(new URL('./server', import.meta.url)), 'CLIENT_URL')
      : {};
  const clientUrl = new URL(backendEnv.CLIENT_URL || 'http://localhost:5173');
  return {
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react()],
    server: {
      host: clientUrl.hostname.replace(/^\[|\]$/g, ''),
      port: Number(clientUrl.port || (clientUrl.protocol === 'https:' ? 443 : 80)),
      strictPort: true,
    },
  };
});
