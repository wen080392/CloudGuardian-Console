import { test, expect, type Page } from '@playwright/test';

/**
 * E2E do fluxo core autenticado: Login → Scan → Auto-Fix.
 *
 * Firebase e o banco são "mockados" sem infra externa:
 *  - Auth: semeamos `localStorage['user_data']` antes do load. O AuthProvider
 *    inicializa `user` a partir daí e `isAuthenticated = !!user` — o app
 *    renderiza o console autenticado sem tocar no Firebase.
 *  - API/DB: todas as chamadas `/api/v1/**` são interceptadas com dados mock.
 *
 * É o teste que blinda as integrações vitais contra regressões (como o
 * crash resource/resourceId, que teria sido pego aqui).
 */

const FAKE_USER = {
  id: 'u-e2e',
  email: 'admin@acme.com',
  full_name: 'Admin E2E',
  company: 'Acme',
  role: 'admin',
  is_active: true,
};

const SCAN_ISSUES = [
  {
    title: 'Bucket S3 com ACL pública',
    description: 'ACL public-read detectada',
    severity: 'critical',
    resource: 'aws_s3_bucket.assets',
    rule_id: 'CKV_AWS_20',
    remediation: 'Defina acl = "private".',
  },
  {
    title: 'Porta SSH (22) aberta para a internet',
    description: 'Ingress 0.0.0.0/0 na porta 22',
    severity: 'high',
    resource: 'aws_security_group.web',
    rule_id: 'CKV_AWS_24',
    remediation: 'Restrinja os cidr_blocks.',
  },
];

async function seedAuthAndApi(page: Page) {
  await page.addInitScript((user) => {
    localStorage.setItem('user_data', JSON.stringify(user));
    localStorage.setItem('access_token', 'e2e-fake-token');
  }, FAKE_USER);

  // Catch-all: qualquer endpoint da API responde vazio (registrado primeiro —
  // rotas específicas registradas depois têm prioridade no Playwright).
  await page.route('**/api/v1/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

  // Scan: retorna vulnerabilidades no shape que o frontend espera
  await page.route('**/api/v1/scans', route => {
    if (route.request().method() !== 'POST') return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 42,
        status: 'completed',
        output_data: { security_issues: SCAN_ISSUES },
      }),
    });
  });
}

test('console autenticado carrega sem passar pela LandingPage', async ({ page }) => {
  await seedAuthAndApi(page);
  await page.goto('/');

  // Item do menu do console (não existe na LandingPage)
  await expect(page.getByText('Security Forge')).toBeVisible();
  // A LandingPage não deve aparecer
  await expect(page.getByText('Pare de apenas alertar riscos.')).toHaveCount(0);
});

test('fluxo Scan → resultados → iniciar Auto-Fix', async ({ page }) => {
  await seedAuthAndApi(page);
  await page.goto('/');

  // Navega para o Scanner (Security Forge)
  await page.getByText('Security Forge').click();
  await expect(page.getByText(/Initiate Security Scan/i)).toBeVisible();

  // Roda o scan (interceptado)
  await page.getByRole('button', { name: /Initiate Security Scan/i }).click();

  // Resultados aparecem
  await expect(page.getByText('Bucket S3 com ACL pública')).toBeVisible();
  await expect(page.getByText('Porta SSH (22) aberta para a internet')).toBeVisible();

  // Auto-Fix: expande o achado e gera a remediação
  await page.getByText('Bucket S3 com ACL pública').click();
  const genBtn = page.getByRole('button', { name: /Gerar Remediação IA/i });
  await genBtn.click();

  // O DiffViewer (revisão da IA) deve renderizar — este era o ponto do crash
  // resource/resourceId; aqui provamos que o fluxo de fix vai até o fim.
  await expect(page.getByText(/IA Proposed Review/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Aplicar Correção IA/i })).toBeVisible();
});
