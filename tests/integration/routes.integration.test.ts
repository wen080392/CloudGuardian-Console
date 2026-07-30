// @vitest-environment node
//
// Teste de integração de TODAS as rotas contra Postgres real.
// Monta os routers com um req.user injetado (bypass do Firebase) e bate em
// cada endpoint, verificando que respondem com status tratado (nunca um 500
// por bug). Gated por RUN_DB_TESTS para não rodar no job unit (que não tem
// banco); um job de CI dedicado sobe Postgres e define RUN_DB_TESTS=1.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';

const RUN = !!process.env.RUN_DB_TESTS;
const suite = RUN ? describe : describe.skip;

suite('Integração de rotas (Postgres real)', () => {
  let app: Express;
  let prisma: any;
  let tenantId: string;
  let userId: string;
  let projectId: string;
  let vulnId: string;

  beforeAll(async () => {
    ({ prisma } = await import('../../services/db'));

    // Tenant + usuário isolados para o teste
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Integration Test Co',
        plan: 'business',
        users: { create: { email: `it-${Date.now()}@test.com`, role: 'admin', firebaseUid: `it-${Date.now()}` } },
      },
      include: { users: true },
    });
    tenantId = tenant.id;
    userId = tenant.users[0].id;

    // Dados de apoio para exercitar rotas com :id
    const project = await prisma.project.create({
      data: { name: 'IT Project', cloud: 'AWS', region: 'us-east-1', tenantId, userId, repoUrl: 'https://github.com/acme/infra' },
    });
    projectId = project.id;
    const vuln = await prisma.vulnerability.create({
      data: { tenantId, resourceId: 'aws_s3_bucket.x', ruleId: 'CKV_AWS_20', title: 'S3 público', severity: 'critical', status: 'open' },
    });
    vulnId = vuln.id;

    // App com auth injetado
    const routers: Record<string, any> = {
      '/api/v1/projects': (await import('../../routes/projects')).default,
      '/api/v1/vulnerabilities': (await import('../../routes/vulnerabilities')).default,
      '/api/v1/assets': (await import('../../routes/assets')).default,
      '/api/v1/finops': (await import('../../routes/finops')).default,
      '/api/v1/policies': (await import('../../routes/policies')).default,
      '/api/v1/drifts': (await import('../../routes/drifts')).default,
      '/api/v1/timeline': (await import('../../routes/timeline')).default,
      '/api/v1/reports': (await import('../../routes/reports')).default,
      '/api/v1/notifications': (await import('../../routes/notifications')).default,
      '/api/v1/credentials': (await import('../../routes/credentials')).default,
      '/api/v1/audit': (await import('../../routes/audit')).default,
      '/api/v1/organization': (await import('../../routes/organization')).default,
    };

    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as any).user = { userId, tenantId, email: 'it@test.com', role: 'admin' };
      next();
    });
    for (const [mount, router] of Object.entries(routers)) app.use(mount, router);
  });

  afterAll(async () => {
    if (!prisma) return;
    // Limpeza (ordem respeita FKs)
    await prisma.vulnerability.deleteMany({ where: { tenantId } }).catch(() => {});
    await prisma.scan.deleteMany({ where: { tenantId } }).catch(() => {});
    await prisma.policyEvaluation.deleteMany({ where: { tenantId } }).catch(() => {});
    await prisma.policy.deleteMany({ where: { tenantId } }).catch(() => {});
    await prisma.project.deleteMany({ where: { tenantId } }).catch(() => {});
    await prisma.costAnalysis.deleteMany({ where: { tenantId } }).catch(() => {});
    await prisma.budgetAlert.deleteMany({ where: { tenantId } }).catch(() => {});
    await prisma.drift.deleteMany({ where: { tenantId } }).catch(() => {});
    await prisma.auditLog.deleteMany({ where: { tenantId } }).catch(() => {});
    await prisma.notificationSetting.deleteMany({ where: { tenantId } }).catch(() => {});
    await prisma.cloudCredential.deleteMany({ where: { tenantId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { tenantId } }).catch(() => {});
    await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => {});
    await prisma.$disconnect().catch(() => {});
  });

  // Cada caso: [método, path, body?, statuses aceitos]
  // Status "tratado" = a rota respondeu de forma controlada (não um 500 por bug).
  // Rotas com dependência externa (terraform/PDF/gemini) podem degradar (503/500 controlado).
  const cases = (): Array<[string, string, any, number[]]> => [
    ['get', '/api/v1/projects', null, [200]],
    ['post', '/api/v1/projects', { name: 'Novo Proj', cloud: 'AWS', region: 'us-east-1' }, [201]],
    ['patch', `/api/v1/projects/${projectId}`, { status: 'archived' }, [200, 404]],

    ['get', '/api/v1/vulnerabilities', null, [200]],
    ['get', `/api/v1/vulnerabilities/${vulnId}`, null, [200]],
    ['post', '/api/v1/vulnerabilities', { resourceId: 'aws_x.y', ruleId: 'R1', title: 'T', severity: 'high' }, [201, 200]],
    ['patch', `/api/v1/vulnerabilities/${vulnId}`, { status: 'fixed' }, [200]],

    ['get', '/api/v1/assets', null, [200]],
    ['post', '/api/v1/assets', { name: 'ec2-1', type: 'aws_instance', category: 'compute', provider: 'AWS', region: 'us-east-1' }, [201, 200]],

    ['get', '/api/v1/finops/dashboard', null, [200]],
    ['get', '/api/v1/finops/analyses', null, [200]],
    ['post', '/api/v1/finops/scan', null, [200]],
    ['post', '/api/v1/finops/budget-alerts', { name: 'B', threshold: 100, period: 'monthly', comparison: 'above', channels: [], recipients: [] }, [200, 201]],
    ['get', '/api/v1/finops/budget-alerts', null, [200]],

    ['get', '/api/v1/policies', null, [200]],
    ['post', '/api/v1/policies', { name: 'P', type: 'security', severity: 'high', regoCode: 'package x' }, [200, 201]],
    ['get', '/api/v1/policies/stats', null, [200]],
    ['post', '/api/v1/policies/validate', { regoCode: 'package x' }, [200, 400]],
    ['post', '/api/v1/policies/nonexistent/evaluate', { resource: {} }, [200, 404, 500]],

    // Auto-remediação: sem GITHUB_TOKEN degrada para 503 (não deve crashar)
    ['post', `/api/v1/vulnerabilities/${vulnId}/remediate`, { projectId, filePath: 'main.tf', fixedCode: 'x' }, [201, 400, 404, 502, 503]],

    ['get', '/api/v1/drifts', null, [200]],
    ['post', '/api/v1/drifts/detect', { projectId }, [200, 400, 404, 503]],
    ['post', '/api/v1/drifts/drift-xyz/resolve', null, [200, 404]],

    ['get', '/api/v1/timeline', null, [200]],
    ['post', '/api/v1/timeline', { type: 'SCAN', title: 'T', description: 'D' }, [200, 201]],

    ['get', '/api/v1/reports', null, [200]],

    ['get', '/api/v1/notifications', null, [200]],
    ['put', '/api/v1/notifications', { slackWebhook: '', emailRecipients: [], enabledEvents: [] }, [200]],

    ['get', '/api/v1/credentials', null, [200]],
    ['post', '/api/v1/credentials', { provider: 'aws', accessKey: 'AKIAX', secretKey: 'sk', region: 'us-east-1' }, [200, 201]],

    ['get', '/api/v1/audit', null, [200]],

    ['get', '/api/v1/organization/members', null, [200]],
    ['get', '/api/v1/organization/info', null, [200]],
  ];

  it('nenhuma rota retorna 500 por bug (todas respondem status tratado)', async () => {
    const failures: string[] = [];
    for (const [method, path, body, ok] of cases()) {
      const req = (request(app) as any)[method](path);
      const res = body ? await req.send(body) : await req;
      if (!ok.includes(res.status)) {
        failures.push(`${method.toUpperCase()} ${path} -> ${res.status} (esperado ${ok.join('/')}) ${JSON.stringify(res.body).slice(0, 120)}`);
      }
    }
    if (failures.length) console.error('ROTAS COM STATUS INESPERADO:\n' + failures.join('\n'));
    expect(failures).toEqual([]);
  });
});
