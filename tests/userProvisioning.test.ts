// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Prisma } from '@prisma/client';

// Banco em memória minimalista que respeita as constraints de unicidade
// (firebaseUid, email) para reproduzir corridas de provisionamento.
interface MemUser {
  id: string;
  firebaseUid: string | null;
  email: string;
  name: string | null;
  role: string;
  tenantId: string | null;
}
interface MemTenant { id: string; name: string; }

const db = {
  users: [] as MemUser[],
  tenants: [] as MemTenant[],
};
let seq = 0;

function uniqueViolation(target: string) {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta: { target },
  });
}

const withTenant = (u: MemUser) => ({
  ...u,
  tenant: db.tenants.find(t => t.id === u.tenantId) ?? null,
});

vi.mock('../services/db', () => ({
  prisma: {
    user: {
      findUnique: async ({ where }: any) => {
        const u = db.users.find(u =>
          where.firebaseUid ? u.firebaseUid === where.firebaseUid : u.email === where.email
        );
        return u ? withTenant(u) : null;
      },
      update: async ({ where, data }: any) => {
        const u = db.users.find(u => u.email === where.email);
        if (!u) throw new Error('not found');
        if (data.firebaseUid && db.users.some(o => o !== u && o.firebaseUid === data.firebaseUid)) {
          throw uniqueViolation('firebaseUid');
        }
        Object.assign(u, data);
        return withTenant(u);
      },
    },
    tenant: {
      create: async ({ data }: any) => {
        const nested = data.users.create;
        // Constraint de unicidade: transação inteira falha, tenant não é criado
        if (db.users.some(u => u.email === nested.email)) throw uniqueViolation('email');
        if (db.users.some(u => u.firebaseUid === nested.firebaseUid)) throw uniqueViolation('firebaseUid');
        const tenant: MemTenant = { id: `t-${++seq}`, name: data.name };
        db.tenants.push(tenant);
        db.users.push({
          id: `u-${++seq}`,
          firebaseUid: nested.firebaseUid,
          email: nested.email,
          name: nested.name,
          role: nested.role,
          tenantId: tenant.id,
        });
        return tenant;
      },
    },
  },
}));

import { provisionUser } from '../services/userProvisioningService';

describe('provisionUser', () => {
  beforeEach(() => {
    db.users.length = 0;
    db.tenants.length = 0;
    seq = 0;
  });

  it('cria tenant e usuário admin no primeiro login', async () => {
    const user = await provisionUser({ firebaseUid: 'uid-1', email: 'ana@acme.com', name: 'Ana' });
    expect(user.role).toBe('admin');
    expect(user.tenantId).toBe(db.tenants[0].id);
    expect(db.tenants).toHaveLength(1);
    expect(db.tenants[0].name).toBe("ana's Company");
  });

  it('usa companyName quando fornecido (fluxo de registro)', async () => {
    await provisionUser({ firebaseUid: 'uid-1', email: 'ana@acme.com', companyName: 'Acme Inc' });
    expect(db.tenants[0].name).toBe('Acme Inc');
  });

  it('retorna o usuário existente sem criar novo tenant', async () => {
    const first = await provisionUser({ firebaseUid: 'uid-1', email: 'ana@acme.com' });
    const second = await provisionUser({ firebaseUid: 'uid-1', email: 'ana@acme.com' });
    expect(second.id).toBe(first.id);
    expect(db.tenants).toHaveLength(1);
  });

  it('vincula o firebaseUid a usuário pré-existente pelo email', async () => {
    db.tenants.push({ id: 't-existing', name: 'Empresa' });
    db.users.push({
      id: 'u-existing', firebaseUid: null, email: 'bob@corp.com',
      name: 'Bob', role: 'viewer', tenantId: 't-existing',
    });
    const user = await provisionUser({ firebaseUid: 'uid-9', email: 'bob@corp.com' });
    expect(user.id).toBe('u-existing');
    expect(user.firebaseUid).toBe('uid-9');
    expect(db.tenants).toHaveLength(1); // nenhum tenant novo
  });

  it('requisições concorrentes no primeiro login não duplicam tenants', async () => {
    const input = { firebaseUid: 'uid-race', email: 'race@acme.com' };
    const [a, b] = await Promise.all([provisionUser(input), provisionUser(input)]);
    expect(a.id).toBe(b.id);
    expect(db.tenants).toHaveLength(1);
    expect(db.users).toHaveLength(1);
  });
});
