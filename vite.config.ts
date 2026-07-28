
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    // e2e/ roda no Playwright, não no vitest (evita casar o glob *.spec.ts)
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
  server: {
    port: 3000,
    host: true,
    allowedHosts: ['cgwebhook1234.loca.lt', 'ais-pre-ib6p6ufo5ebznjgfv4thp2-168681835560.us-west2.run.app']
  }
});
