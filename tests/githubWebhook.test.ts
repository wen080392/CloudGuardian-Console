// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'crypto';

vi.mock('../services/db', () => ({ prisma: {} }));

import { verifyGithubSignature } from '../routes/webhook';

const sign = (body: Buffer, secret: string) =>
  `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;

describe('verifyGithubSignature (fail-closed)', () => {
  const body = Buffer.from(JSON.stringify({ action: 'opened' }));

  beforeEach(() => vi.stubEnv('GITHUB_WEBHOOK_SECRET', 'topsecret'));
  afterEach(() => vi.unstubAllEnvs());

  it('aceita assinatura válida', () => {
    expect(verifyGithubSignature(body, sign(body, 'topsecret'))).toBe(true);
  });

  it('rejeita assinatura com segredo errado', () => {
    expect(verifyGithubSignature(body, sign(body, 'wrong'))).toBe(false);
  });

  it('rejeita quando a assinatura está ausente', () => {
    expect(verifyGithubSignature(body, undefined)).toBe(false);
  });

  it('rejeita corpo adulterado (assinatura não corresponde)', () => {
    const sig = sign(body, 'topsecret');
    const tampered = Buffer.from(JSON.stringify({ action: 'closed' }));
    expect(verifyGithubSignature(tampered, sig)).toBe(false);
  });

  it('fail-closed: sem GITHUB_WEBHOOK_SECRET configurado, rejeita tudo', () => {
    vi.stubEnv('GITHUB_WEBHOOK_SECRET', '');
    expect(verifyGithubSignature(body, sign(body, 'topsecret'))).toBe(false);
  });

  it('rejeita assinatura de tamanho divergente sem lançar', () => {
    expect(verifyGithubSignature(body, 'sha256=curto')).toBe(false);
  });
});
