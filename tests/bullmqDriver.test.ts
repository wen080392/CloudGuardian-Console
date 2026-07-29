// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks de ioredis e bullmq (sem Redis real) ---
const redisInstances: any[] = [];
class FakeRedis {
  opts: any;
  handlers: Record<string, Function> = {};
  quit = vi.fn(async () => {});
  constructor(url: string, opts: any) { this.opts = { url, ...opts }; redisInstances.push(this); }
  on(ev: string, fn: Function) { this.handlers[ev] = fn; return this; }
  duplicate() { return new FakeRedis(this.opts.url, this.opts); }
}
vi.mock('ioredis', () => ({ default: FakeRedis }));

const added: any[] = [];
const queueClose = vi.fn(async () => {});
const eventsClose = vi.fn(async () => {});
const workerClose = vi.fn(async () => {});
vi.mock('bullmq', () => ({
  Queue: class { constructor(public name: string, public opts: any) {}
    add = vi.fn(async (name: string, data: any, jobOpts: any) => {
      added.push({ name, data, jobOpts });
      return { waitUntilFinished: async () => {} };
    });
    close = queueClose;
  },
  QueueEvents: class { constructor(public name: string, public opts: any) {}
    waitUntilReady = async () => {};
    close = eventsClose;
  },
  Worker: class { constructor(public name: string, public fn: Function, public opts: any) {}
    on() { return this; }
    close = workerClose;
  },
}));

import { BullMqQueueDriver } from '../services/queue/bullmqDriver';

describe('BullMqQueueDriver', () => {
  beforeEach(() => { redisInstances.length = 0; added.length = 0; });

  it('conecta ao ioredis com a URL e maxRetriesPerRequest:null (exigência do BullMQ)', async () => {
    const d = new BullMqQueueDriver('redis://cache:6379');
    d.add('scan', { x: 1 }); // dispara init via ready
    await new Promise(r => setTimeout(r, 10));
    const primary = redisInstances[0];
    expect(primary.opts.url).toBe('redis://cache:6379');
    expect(primary.opts.maxRetriesPerRequest).toBeNull();
  });

  it('enfileira com retry/backoff configurados', async () => {
    const d = new BullMqQueueDriver('redis://cache:6379');
    await d.add('report', { r: 1 }).done;
    expect(added[0].name).toBe('report');
    expect(added[0].jobOpts.attempts).toBeGreaterThanOrEqual(1);
    expect(added[0].jobOpts.backoff.type).toBe('exponential');
  });

  it('close() encerra worker, fila, events e conexão graciosamente', async () => {
    const d = new BullMqQueueDriver('redis://cache:6379');
    d.process(async () => {});
    await d.add('scan', {}).done;
    await d.close();
    expect(queueClose).toHaveBeenCalled();
    expect(eventsClose).toHaveBeenCalled();
    expect(redisInstances[0].quit).toHaveBeenCalled();
  });

  it('name é "bullmq"', () => {
    expect(new BullMqQueueDriver('redis://x').name).toBe('bullmq');
  });
});
