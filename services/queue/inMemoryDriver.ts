import type { QueueDriver, JobProcessor, JobType, EnqueueResult } from './types';

interface Job {
  id: string;
  type: JobType;
  data: any;
  resolve: () => void;
  reject: (e: unknown) => void;
}

/**
 * Driver de fila em memória (single-process).
 *
 * Processa jobs sequencialmente. Perde jobs em restart — adequado para
 * desenvolvimento e deploys single-node; produção deve usar o driver BullMQ
 * (REDIS_URL definido).
 */
export class InMemoryQueueDriver implements QueueDriver {
  readonly name = 'in-memory';
  private queue: Job[] = [];
  private processing = false;
  private processor?: JobProcessor;
  private seq = 0;

  process(processor: JobProcessor): void {
    this.processor = processor;
  }

  add(type: JobType, data: any): EnqueueResult {
    const id = `job-${Date.now()}-${++this.seq}`;
    let resolve!: () => void;
    let reject!: (e: unknown) => void;
    const done = new Promise<void>((res, rej) => { resolve = res; reject = rej; });
    this.queue.push({ id, type, data, resolve, reject });
    void this.drain();
    return { jobId: id, done };
  }

  private async drain(): Promise<void> {
    if (this.processing) return;
    if (!this.processor) return;
    this.processing = true;
    try {
      while (this.queue.length > 0) {
        const job = this.queue.shift()!;
        try {
          await this.processor(job.type, job.data);
          job.resolve();
        } catch (e) {
          console.error(`[Queue:in-memory] job ${job.id} (${job.type}) falhou:`, e);
          job.reject(e);
        }
      }
    } finally {
      this.processing = false;
    }
  }
}
