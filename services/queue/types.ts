export type JobType = 'scan' | 'content-scan' | 'report';

export interface EnqueueResult {
  jobId: string;
  /** Resolve quando o job termina (usado pelo endpoint síncrono de scan). */
  done: Promise<void>;
}

/** Handler que processa um job de um dado tipo. Registrado uma vez no boot. */
export type JobProcessor = (type: JobType, data: any) => Promise<void>;

export interface QueueDriver {
  /** Nome do driver, para logs e diagnóstico (ex.: "in-memory", "bullmq"). */
  readonly name: string;
  /** Registra o processador. Deve ser chamado uma vez antes de enfileirar. */
  process(processor: JobProcessor): void;
  /** Enfileira um job. */
  add(type: JobType, data: any): EnqueueResult;
}
