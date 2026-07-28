import type { QueueDriver, JobProcessor, JobType, EnqueueResult } from './types';

const QUEUE_NAME = 'cloudguardian';

/**
 * Driver de fila distribuída sobre BullMQ + Redis.
 *
 * Ativado quando REDIS_URL está definido. Sobrevive a restarts, permite
 * múltiplos workers e distribui o processamento. O import do BullMQ é
 * dinâmico para que o driver in-memory nunca carregue Redis.
 */
export class BullMqQueueDriver implements QueueDriver {
  readonly name = 'bullmq';
  private queue: any;
  private events: any;
  private ready: Promise<void>;
  private connection: any;

  constructor(private redisUrl: string) {
    this.ready = this.init();
  }

  private async init(): Promise<void> {
    const { Queue, QueueEvents } = await import('bullmq');
    // ioredis aceita a URL diretamente; a connection é compartilhada
    this.connection = { url: this.redisUrl };
    this.queue = new Queue(QUEUE_NAME, { connection: this.connection });
    this.events = new QueueEvents(QUEUE_NAME, { connection: this.connection });
    await this.events.waitUntilReady();
    console.log('[Queue:bullmq] conectado ao Redis.');
  }

  process(processor: JobProcessor): void {
    void this.startWorker(processor);
  }

  private async startWorker(processor: JobProcessor): Promise<void> {
    const { Worker } = await import('bullmq');
    new Worker(
      QUEUE_NAME,
      async (job: any) => { await processor(job.name as JobType, job.data); },
      { connection: this.connection ?? { url: this.redisUrl }, concurrency: Number(process.env.QUEUE_CONCURRENCY ?? 2) }
    );
    console.log('[Queue:bullmq] worker iniciado.');
  }

  add(type: JobType, data: any): EnqueueResult {
    const done = (async () => {
      await this.ready;
      const job = await this.queue.add(type, data, {
        removeOnComplete: 1000,
        removeOnFail: 5000,
        attempts: Number(process.env.QUEUE_ATTEMPTS ?? 3),
        backoff: { type: 'exponential', delay: 2000 },
      });
      // Aguarda a conclusão real do job (cross-process) via QueueEvents
      await job.waitUntilFinished(this.events);
    })();

    return { jobId: `bullmq-${Date.now()}`, done };
  }
}
