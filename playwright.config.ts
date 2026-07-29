import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';

// Em ambientes que já trazem o Chromium pré-instalado (ex.: /opt/pw-browsers),
// aponta o executável direto para evitar o download de uma versão pinada.
// Em CI, o job roda `playwright install chromium` e este glob não encontra
// nada, deixando o Playwright usar seu browser padrão.
function preinstalledChromium(): string | undefined {
  if (process.env.PW_CHROMIUM_PATH) return process.env.PW_CHROMIUM_PATH;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  try {
    const dir = fs.readdirSync(base).find(d => /^chromium-\d+$/.test(d));
    if (dir) {
      const bin = `${base}/${dir}/chrome-linux/chrome`;
      if (fs.existsSync(bin)) return bin;
    }
  } catch { /* base inexistente — usa o padrão */ }
  return undefined;
}
const executablePath = preinstalledChromium();

/**
 * E2E do CloudGuardian. Os testes rodam contra o frontend buildado (vite
 * preview) e interceptam as chamadas de API — não exigem backend/DB de pé.
 * Fluxos autenticados (login → scan → fix) ficam para um job de CI com
 * Postgres + Firebase provisionados.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
