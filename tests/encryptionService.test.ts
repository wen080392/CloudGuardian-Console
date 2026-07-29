// @vitest-environment node
import { describe, it, expect, afterEach, vi } from 'vitest';
import { EncryptionService } from '../services/encryptionService';

describe('EncryptionService (fail-closed)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('em produção sem KMS configurado, encrypt lança em vez de gravar plaintext', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AWS_KMS_KEY_ID', '');
    vi.stubEnv('AWS_REGION', '');
    const svc = new EncryptionService();
    await expect(svc.encrypt('super-secret')).rejects.toThrow(/KMS não configurado/);
  });

  it('em produção, decrypt de valor dev (não criptografado) lança', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AWS_KMS_KEY_ID', '');
    vi.stubEnv('AWS_REGION', '');
    const svc = new EncryptionService();
    const devValue = 'dev-unencrypted-' + Buffer.from('key').toString('base64');
    await expect(svc.decrypt(devValue)).rejects.toThrow(/Rotacione/);
  });

  it('em desenvolvimento, faz roundtrip com prefixo claramente não-criptografado', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('AWS_KMS_KEY_ID', '');
    vi.stubEnv('AWS_REGION', '');
    const svc = new EncryptionService();
    const encrypted = await svc.encrypt('AKIA_FAKE_KEY');
    expect(encrypted).toMatch(/^dev-unencrypted-/);
    expect(encrypted).not.toContain('AKIA_FAKE_KEY');
    await expect(svc.decrypt(encrypted)).resolves.toBe('AKIA_FAKE_KEY');
  });

  it('nunca retorna o plaintext puro no valor "criptografado"', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('AWS_KMS_KEY_ID', '');
    vi.stubEnv('AWS_REGION', '');
    const svc = new EncryptionService();
    const secret = 'minha-chave-secreta-123';
    const stored = await svc.encrypt(secret);
    expect(stored).not.toBe(secret);
    expect(stored.includes(secret)).toBe(false);
  });

  it('decrypta valores com o prefixo legado de dev (aws-kms-encrypted-)', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('AWS_KMS_KEY_ID', '');
    vi.stubEnv('AWS_REGION', '');
    const svc = new EncryptionService();
    const legacy = 'aws-kms-encrypted-' + Buffer.from('old-secret').toString('base64');
    await expect(svc.decrypt(legacy)).resolves.toBe('old-secret');
  });
});
