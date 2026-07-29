import { test, expect } from '@playwright/test';

/**
 * E2E do funil PLG (auditoria de 5 minutos). Intercepta o endpoint público
 * para não depender de backend/DB e valida o fluxo real no browser:
 * colar Terraform → rodar → ver score/severidades → link do PDF.
 *
 * Este é o tipo de teste que teria pego automaticamente o crash de
 * "tela preta" (shape de dado inesperado derrubando o React).
 */
test('funil de auditoria: cola Terraform, roda e vê o resultado', async ({ page }) => {
  await page.route('**/api/v1/audit/instant', async route => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        auditId: 'a1',
        score: 30,
        engine: 'native',
        summary: { critical: 2, high: 1, medium: 0, low: 1, total: 4 },
        topFindings: [
          { ruleId: 'CKV_AWS_20', title: 'Bucket S3 com ACL pública', severity: 'critical', resource: 'aws_s3_bucket.assets', remediation: 'x' },
          { ruleId: 'CKV_AWS_24', title: 'Porta SSH (22) aberta', severity: 'high', resource: 'aws_security_group.web', remediation: 'x' },
        ],
        reportUrl: '/api/v1/audit/instant/a1/report.pdf?token=tok',
      }),
    });
  });

  await page.goto('/');
  await page.locator('#auditoria').scrollIntoViewIfNeeded();

  await page.getByPlaceholder('seu@email.com').fill('lead@empresa.com');
  await page.getByRole('button', { name: /usar exemplo/i }).click();
  await page.getByRole('button', { name: /rodar auditoria/i }).click();

  // O painel de resultado deve mostrar o score e as severidades
  await expect(page.getByText('30', { exact: true })).toBeVisible();
  await expect(page.getByText('Bucket S3 com ACL pública')).toBeVisible();
  await expect(page.getByText('CKV_AWS_20')).toBeVisible();

  // E o CTA de download do relatório
  const pdf = page.getByRole('link', { name: /baixar relatório executivo/i });
  await expect(pdf).toHaveAttribute('href', /report\.pdf\?token=tok/);
});

test('funil valida email obrigatório', async ({ page }) => {
  await page.goto('/');
  await page.locator('#auditoria').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: /usar exemplo/i }).click();
  await page.getByRole('button', { name: /rodar auditoria/i }).click();
  await expect(page.getByText(/informe seu email/i)).toBeVisible();
});
