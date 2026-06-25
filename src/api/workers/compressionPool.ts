import { fileURLToPath } from 'node:url';

import Piscina from 'piscina';

import type {
  BlurCompressionJob,
  BlurCompressionResult,
  CompressionJob,
  VariantCompressionJob,
  VariantCompressionResult,
} from './compressionJobs.js';

export type CompressionPoolOptions = {
  maxThreads?: number;
};

export class CompressionPool {
  #pool: Piscina;
  #inFlight = 0;
  readonly maxThreads?: number;

  constructor(options?: CompressionPoolOptions) {
    if (options?.maxThreads !== undefined) {
      this.maxThreads = options.maxThreads;
    }
    const execArgv = process.execArgv.includes('--experimental-strip-types')
      ? process.execArgv
      : [...process.execArgv, '--experimental-strip-types'];

    this.#pool = new Piscina({
      filename: fileURLToPath(new URL('./compressionWorker.ts', import.meta.url)),
      execArgv,
      ...(options?.maxThreads !== undefined ? { maxThreads: options.maxThreads } : {}),
    });
  }

  get queueSize(): number {
    return this.#pool.queueSize;
  }

  get pending(): number {
    return this.#inFlight + this.#pool.queueSize;
  }

  runVariant(job: Omit<VariantCompressionJob, 'type'>): Promise<VariantCompressionResult> {
    return this.#run({ type: 'variant', ...job });
  }

  runBlur(job: Omit<BlurCompressionJob, 'type'>): Promise<BlurCompressionResult> {
    return this.#run({ type: 'blur', ...job });
  }

  async onIdle(): Promise<void> {
    while (this.pending > 0) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 16);
      });
    }
  }

  async destroy(): Promise<void> {
    await this.#pool.destroy();
  }

  async #run<T extends CompressionJob>(
    job: T,
  ): Promise<T extends { type: 'blur' } ? BlurCompressionResult : VariantCompressionResult> {
    this.#inFlight++;
    try {
      return (await this.#pool.run(job)) as T extends { type: 'blur' }
        ? BlurCompressionResult
        : VariantCompressionResult;
    } finally {
      this.#inFlight--;
    }
  }
}
