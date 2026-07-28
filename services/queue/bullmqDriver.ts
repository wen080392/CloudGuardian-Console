import type { QueueDriver, JobProcessor, JobType, EnqueueResult } from './types';

const QUEUE_NAME = 'cloudguardian';

/**
 * Driver de fila distribuída sobre BullMQ + Redis.
 *
 * Ativado quando REDIS_URL está definido. Sobrevive a restarts, permite
 * múltiplos workers e distribui o processamento. O import do BullMQ/ioredis é
 * dinâmico para que o driver in-memory nunca carregue Redis.
 */
export class BullMqQueueDriver implements QueueDriver {
  readonly name = 'bullmq';
  private queue: any;
  private events: any;
  private worker: any;
  private connection: any;
  private ready: Promise<void>;
  private closing = false;

  constructor(private redisUrl: string) {
    this.ready = this.init();
  }

  private async init(): Promise<void> {
    const IORedis = (await import('ioredis')).default;
    const { Queue, QueueEvents } = await import('bullmq');

    // maxRetriesPerRequest DEVE ser null para as conexões bloqueantes do
    // BullMQ (Worker/QueueEvents). A URL é passada como string ao ioredis —
    // `{ url }` não é uma opção válida e conectaria em localhost por engano.
    this.connection = new IORedis(this.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    this.connection.on('error', (e: Error) => console.error('[Queue:bullmq] erro de conexão Redis:', e.message));

    this.queue = new Queue(QUEUE_NAME, { connection: this.connection });
    this.events = new QueueEvents(QUEUE_NAME, { connection: this.connection.duplicate() });
    await this.events.waitUntilReady();
    console.log('[Queue:bullmq] conectado ao Redis.');
  }

  process(processor: JobProcessor): void {
    void this.startWorker(processor);
  }

  private async startWorker(processor: JobProcessor): Promise<void> {
    await this.ready;
    const { Worker } = await import('bullmq');
    this.worker = new Worker(
      QUEUE_NAME,
      async (job: any) => { await processor(job.name as JobType, job.data); },
      { connection: this.connection.duplicate(), concurrency: Number(process.env.QUEUE_CONCURRENCY ?? 2) }
    );
    this.worker.on('failed', (job: any, err: Error) =>
      console.error(`[Queue:bullmq] job ${job?.id} (${job?.name}) falhou:`, err?.message));
    this.worker.on('error', (err: Error) =>
      console.error('[Queue:bullmq] erro no worker:', err?.message));
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

  /** Encerra worker, fila e conexões de forma graciosa (SIGTERM/SIGINT). */
  async close(): Promise<void> {
    if (this.closing) return;
    this.closing = true;
    await this.ready.catch(() => {});
    await this.worker?.close().catch(() => {});
    await this.queue?.close().catch(() => {});
    await this.events?.close().catch(() => {});
    await this.connection?.quit().catch(() => {});
    console.log('[Queue:bullmq] encerrado.');
  }
}
