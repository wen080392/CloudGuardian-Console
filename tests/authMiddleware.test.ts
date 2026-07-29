// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

const verifyIdToken = vi.fn();
vi.mock('../services/firebaseAdmin', () => ({
  adminAuth: { verifyIdToken: (...args: any[]) => verifyIdToken(...args) },
}));

const provisionUser = vi.fn();
vi.mock('../services/userProvisioningService', () => ({
  provisionUser: (...args: any[]) => provisionUser(...args),
}));

import { authMiddleware } from '../middleware/auth';

function mockRes() {
  const res: any = { statusCode: 200, body: undefined };
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (body: any) => { res.body = body; return res; };
  return res;
}

describe('authMiddleware', () => {
  beforeEach(() => {
    verifyIdToken.mockReset();
    provisionUser.mockReset();
  });

  it('retorna 401 sem header Authorization', async () => {
    const req: any = { headers: {} };
    const res = mockRes();
    const next = vi.fn();
    await authMiddleware(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 401 quando o token Firebase é inválido', async () => {
    verifyIdToken.mockRejectedValue(new Error('invalid token'));
    const req: any = { headers: { authorization: 'Bearer bad-token' } };
    const res = mockRes();
    const next = vi.fn();
    await authMiddleware(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
    expect(provisionUser).not.toHaveBeenCalled();
  });

  it('token válido: provisiona e anexa o contexto do usuário', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'uid-1', email: 'ana@acme.com', name: 'Ana' });
    provisionUser.mockResolvedValue({
      id: 'u-1', tenantId: 't-1', email: 'ana@acme.com', role: 'admin',
    });
    const req: any = { headers: { authorization: 'Bearer good-token' } };
    const res = mockRes();
    const next = vi.fn();
    await authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual({
      userId: 'u-1', tenantId: 't-1', email: 'ana@acme.com', role: 'admin',
    });
    expect(provisionUser).toHaveBeenCalledWith({
      firebaseUid: 'uid-1', email: 'ana@acme.com', name: 'Ana',
    });
  });

  it('falha de banco no provisionamento vira 500, não next()', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'uid-1', email: 'ana@acme.com' });
    provisionUser.mockRejectedValue(new Error('db down'));
    const req: any = { headers: { authorization: 'Bearer good-token' } };
    const res = mockRes();
    const next = vi.fn();
    await authMiddleware(req, res, next);
    expect(res.statusCode).toBe(500);
    expect(next).not.toHaveBeenCalled();
  });
});
