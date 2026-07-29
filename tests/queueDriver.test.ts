// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { InMemoryQueueDriver } from '../services/queue/inMemoryDriver';

describe('InMemoryQueueDriver', () => {
  it('processa jobs na ordem e resolve a promise done', async () => {
    const driver = new InMemoryQueueDriver();
    const seen: string[] = [];
    driver.process(async (type, data) => { seen.push(`${type}:${data.n}`); });

    const a = driver.add('scan', { n: 1 });
    const b = driver.add('report', { n: 2 });
    await Promise.all([a.done, b.done]);

    expect(seen).toEqual(['scan:1', 'report:2']);
  });

  it('rejeita a promise done quando o processor lança', async () => {
    const driver = new InMemoryQueueDriver();
    driver.process(async () => { throw new Error('boom'); });
    await expect(driver.add('content-scan', {}).done).rejects.toThrow('boom');
  });

  it('um job que falha não trava os seguintes', async () => {
    const driver = new InMemoryQueueDriver();
    const ok: number[] = [];
    driver.process(async (_type, data) => {
      if (data.n === 1) throw new Error('falha');
      ok.push(data.n);
    });

    const r1 = driver.add('scan', { n: 1 });
    const r2 = driver.add('scan', { n: 2 });
    await expect(r1.done).rejects.toThrow('falha');
    await r2.done;
    expect(ok).toEqual([2]);
  });

  it('gera jobIds únicos', () => {
    const driver = new InMemoryQueueDriver();
    driver.process(async () => {});
    const ids = new Set([
      driver.add('scan', {}).jobId,
      driver.add('scan', {}).jobId,
      driver.add('scan', {}).jobId,
    ]);
    expect(ids.size).toBe(3);
  });
});

describe('getQueueDriver', () => {
  it('usa in-memory quando REDIS_URL ausente', async () => {
    vi.stubEnv('REDIS_URL', '');
    const { getQueueDriver, __resetQueueDriver } = await import('../services/queue');
    __resetQueueDriver();
    expect(getQueueDriver().name).toBe('in-memory');
    __resetQueueDriver();
    vi.unstubAllEnvs();
  });
});
