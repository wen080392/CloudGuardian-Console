// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

// ---- Prisma em memória com filtro real por tenantId ----
// (vi.hoisted: o factory de vi.mock é içado para o topo do arquivo)
const { tables, delegate } = vi.hoisted(() => {
  type Row = Record<string, any>;
  const tables: Record<string, Row[]> = {
    cloudCredential: [],
    project: [],
    vulnerability: [],
  };

  const matches = (row: Row, where: Row = {}) =>
    Object.entries(where).every(([k, v]) => row[k] === v);

  const delegate = (name: string) => ({
    findMany: async ({ where }: any = {}) => tables[name].filter(r => matches(r, where)),
    findFirst: async ({ where }: any = {}) => tables[name].find(r => matches(r, where)) ?? null,
    deleteMany: async ({ where }: any = {}) => {
      const before = tables[name].length;
      tables[name] = tables[name].filter(r => !matches(r, where));
      return { count: before - tables[name].length };
    },
    updateMany: async ({ where, data }: any) => {
      const rows = tables[name].filter(r => matches(r, where));
      rows.forEach(r => Object.assign(r, data));
      return { count: rows.length };
    },
    upsert: async ({ where, create }: any) => {
      tables[name].push({ id: `new-${Date.now()}`, ...create });
      return tables[name][tables[name].length - 1];
    },
  });

  return { tables, delegate };
});

vi.mock('../services/db', () => ({
  prisma: {
    cloudCredential: delegate('cloudCredential'),
    project: delegate('project'),
    vulnerability: delegate('vulnerability'),
  },
}));
vi.mock('../services/auditService', () => ({
  audit: { log: vi.fn() },
}));

import credentialsRouter from '../routes/credentials';
import projectsRouter from '../routes/projects';
import vulnerabilitiesRouter from '../routes/vulnerabilities';

// App de teste autenticado como o TENANT A
function appAs(tenantId: string) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { userId: 'user-a', tenantId, email: 'a@a.com', role: 'admin' };
    next();
  });
  app.use('/credentials', credentialsRouter);
  app.use('/projects', projectsRouter);
  app.use('/vulnerabilities', vulnerabilitiesRouter);
  return app;
}

describe('Isolamento multi-tenant', () => {
  beforeEach(() => {
    tables.cloudCredential = [
      { id: 'cred-a', tenantId: 'tenant-a', provider: 'aws', region: 'us-east-1' },
      { id: 'cred-b', tenantId: 'tenant-b', provider: 'aws', region: 'eu-west-1' },
    ];
    tables.project = [
      { id: 'proj-a', tenantId: 'tenant-a', name: 'A', cloud: 'AWS', region: 'us-east-1', status: 'active', score: 90, repoUrl: null, createdAt: new Date(), scans: [] },
      { id: 'proj-b', tenantId: 'tenant-b', name: 'B', cloud: 'GCP', region: 'us-central1', status: 'active', score: 70, repoUrl: null, createdAt: new Date(), scans: [] },
    ];
    tables.vulnerability = [
      { id: 'vuln-a', tenantId: 'tenant-a', title: 'S3 público', severity: 'critical', status: 'open' },
      { id: 'vuln-b', tenantId: 'tenant-b', title: 'SG aberto', severity: 'high', status: 'open' },
    ];
  });

  it('GET /credentials retorna apenas credenciais do próprio tenant', async () => {
    const res = await request(appAs('tenant-a')).get('/credentials');
    expect(res.status).toBe(200);
    expect(res.body.map((c: any) => c.id)).toEqual(['cred-a']);
  });

  it('DELETE /credentials/:id não apaga credencial de outro tenant', async () => {
    await request(appAs('tenant-a')).delete('/credentials/cred-b');
    expect(tables.cloudCredential.find(c => c.id === 'cred-b')).toBeDefined();
  });

  it('GET /projects retorna apenas projetos do próprio tenant', async () => {
    const res = await request(appAs('tenant-a')).get('/projects');
    expect(res.status).toBe(200);
    expect(res.body.map((p: any) => p.id)).toEqual(['proj-a']);
  });

  it('PATCH /projects/:id de outro tenant responde 404 e não altera nada', async () => {
    const res = await request(appAs('tenant-a'))
      .patch('/projects/proj-b')
      .send({ name: 'hacked' });
    expect(res.status).toBe(404);
    expect(tables.project.find(p => p.id === 'proj-b')!.name).toBe('B');
  });

  it('GET /vulnerabilities retorna apenas vulnerabilidades do próprio tenant', async () => {
    const res = await request(appAs('tenant-a')).get('/vulnerabilities');
    expect(res.status).toBe(200);
    expect(res.body.map((v: any) => v.id)).toEqual(['vuln-a']);
  });

  it('GET /vulnerabilities/:id de outro tenant responde 404', async () => {
    const res = await request(appAs('tenant-a')).get('/vulnerabilities/vuln-b');
    expect(res.status).toBe(404);
  });

  it('sem contexto de tenant, rotas respondem 403', async () => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = { userId: 'u', tenantId: null, email: 'x@x.com', role: 'viewer' };
      next();
    });
    app.use('/credentials', credentialsRouter);
    const res = await request(app).get('/credentials');
    expect(res.status).toBe(403);
  });
});
