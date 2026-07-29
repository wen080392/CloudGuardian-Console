import type { QueueDriver } from './types';
import { InMemoryQueueDriver } from './inMemoryDriver';
import { BullMqQueueDriver } from './bullmqDriver';

export type { QueueDriver, JobProcessor, JobType, EnqueueResult } from './types';

let driver: QueueDriver | null = null;

/**
 * Escolhe o driver de fila: BullMQ/Redis se REDIS_URL estiver definido,
 * caso contrário in-memory. Singleton por processo.
 */
export function getQueueDriver(): QueueDriver {
  if (driver) return driver;
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    driver = new BullMqQueueDriver(redisUrl);
    console.log('[Queue] driver: bullmq (Redis)');
  } else {
    driver = new InMemoryQueueDriver();
    console.log('[Queue] driver: in-memory (defina REDIS_URL para produção distribuída)');
  }
  return driver;
}

/** Encerra o driver ativo de forma graciosa (shutdown). */
export async function closeQueueDriver(): Promise<void> {
  await driver?.close?.();
}

/** Reseta o singleton — usado apenas em testes. */
export function __resetQueueDriver(): void {
  driver = null;
}
