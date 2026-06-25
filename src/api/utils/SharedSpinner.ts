import { blue, dim, magenta } from 'kleur/colors';
import ora, { type Ora } from 'ora';

import { componentTypeToTag } from '../../const.js';

type Job = {
  componentType: 'img' | 'picture' | 'background';
  src: string;
  variantCompleted: number;
  variantTotal: number;
  queuedVariantKeys: Set<string>;
  completedVariantKeys: Set<string>;
};

export type ImgProcSpinnerHandle = {
  set text(value: string);
  setVariantProgress(completed: number, total: number): void;
  noteVariantQueued(variantKey: string): void;
  noteVariantCompleted(variantKey: string): void;
  resetVariantProgress(): void;
  succeed(message?: string): void;
  fail(message?: string): void;
  cancel(): void;
};

class JobSpinnerHandle implements ImgProcSpinnerHandle {
  constructor(
    private readonly manager: SharedSpinner,
    private readonly id: string,
  ) {}

  set text(value: string) {
    const match = value.match(/\((\d+)\/(\d+)\)/);
    if (match) {
      this.manager.setVariantProgress(this.id, Number(match[1]), Number(match[2]));
    }
  }

  setVariantProgress(completed: number, total: number) {
    this.manager.setVariantProgress(this.id, completed, total);
  }

  noteVariantQueued(variantKey: string) {
    this.manager.noteVariantQueued(this.id, variantKey);
  }

  noteVariantCompleted(variantKey: string) {
    this.manager.noteVariantCompleted(this.id, variantKey);
  }

  resetVariantProgress() {
    this.manager.resetVariantProgress(this.id);
  }

  succeed(message?: string) {
    this.manager.succeed(this.id, message);
  }

  fail(message?: string) {
    this.manager.fail(this.id, message);
  }

  cancel() {
    this.manager.cancel(this.id);
  }
}

export class SharedSpinner {
  #ora: Ora;
  #jobs = new Map<string, Job>();
  #jobIdByKey = new Map<string, string>();
  #nextId = 0;

  constructor() {
    this.#ora = ora('Processing...');
    this.#ora.prefixText = blue('[astro-image-processor]');
  }

  create(
    componentType: 'img' | 'picture' | 'background',
    src: string,
    dedupeKey?: string,
  ): { id: string; spinner: ImgProcSpinnerHandle } {
    if (dedupeKey !== undefined) {
      const existingId = this.#jobIdByKey.get(dedupeKey);
      if (existingId !== undefined) {
        const existingJob = this.#jobs.get(existingId);
        if (existingJob) {
          existingJob.componentType = componentType;
          existingJob.src = src;
          this.#refresh();
          if (!this.#ora.isSpinning) {
            this.#ora.start();
          }
          return {
            id: existingId,
            spinner: new JobSpinnerHandle(this, existingId),
          };
        }
      }
    }

    const id = String(++this.#nextId);
    this.#jobs.set(id, {
      componentType,
      src,
      variantCompleted: 0,
      variantTotal: 0,
      queuedVariantKeys: new Set(),
      completedVariantKeys: new Set(),
    });
    if (dedupeKey !== undefined) {
      this.#jobIdByKey.set(dedupeKey, id);
    }
    this.#refresh();
    if (!this.#ora.isSpinning) {
      this.#ora.start();
    }

    return {
      id,
      spinner: new JobSpinnerHandle(this, id),
    };
  }

  setVariantProgress(id: string, completed: number, total: number) {
    const job = this.#jobs.get(id);
    if (!job) {
      return;
    }
    job.variantCompleted = completed;
    job.variantTotal = total;
    this.#refresh();
  }

  noteVariantQueued(id: string, variantKey: string) {
    const job = this.#jobs.get(id);
    if (!job || job.queuedVariantKeys.has(variantKey)) {
      return;
    }
    job.queuedVariantKeys.add(variantKey);
    job.variantTotal++;
    this.#refresh();
  }

  noteVariantCompleted(id: string, variantKey: string) {
    const job = this.#jobs.get(id);
    if (!job || job.completedVariantKeys.has(variantKey)) {
      return;
    }
    if (!job.queuedVariantKeys.has(variantKey)) {
      return;
    }
    job.completedVariantKeys.add(variantKey);
    job.variantCompleted++;
    this.#refresh();
  }

  resetVariantProgress(id: string) {
    const job = this.#jobs.get(id);
    if (!job) {
      return;
    }
    job.variantCompleted = 0;
    job.variantTotal = 0;
    job.queuedVariantKeys.clear();
    job.completedVariantKeys.clear();
    this.#refresh();
  }

  succeed(id: string, message?: string) {
    this.#clearJobKey(id);
    this.#jobs.delete(id);
    if (this.#jobs.size === 0) {
      this.#ora.succeed(message ?? 'Completed');
      return;
    }
    this.#refresh();
  }

  fail(id: string, message?: string) {
    this.#clearJobKey(id);
    this.#jobs.delete(id);
    if (this.#jobs.size === 0) {
      this.#ora.fail(message ?? 'Failed');
      return;
    }
    this.#refresh();
  }

  cancel(id: string) {
    this.#clearJobKey(id);
    this.#jobs.delete(id);
    if (this.#jobs.size === 0) {
      this.#ora.stop();
      return;
    }
    this.#refresh();
  }

  #clearJobKey(id: string) {
    for (const [key, jobId] of this.#jobIdByKey) {
      if (jobId === id) {
        this.#jobIdByKey.delete(key);
        return;
      }
    }
  }

  #refresh() {
    const jobs = [...this.#jobs.values()];
    if (jobs.length === 0) {
      return;
    }

    if (jobs.length === 1) {
      const job = jobs[0] as Job;
      const tag = magenta(` ${componentTypeToTag[job.componentType]}`);
      const srcLabel = dim(` ${job.src}`);
      this.#ora.prefixText = blue('[astro-image-processor]') + tag + srcLabel;
      this.#ora.text =
        job.variantTotal > 0
          ? `Processing... (${job.variantCompleted}/${job.variantTotal})`
          : 'Processing...';
      return;
    }

    const variantTotal = jobs.reduce((sum, job) => sum + job.variantTotal, 0);
    const variantCompleted = jobs.reduce((sum, job) => sum + job.variantCompleted, 0);
    this.#ora.prefixText = blue('[astro-image-processor]');
    this.#ora.text =
      variantTotal > 0
        ? `Processing ${jobs.length} images... (${variantCompleted}/${variantTotal} variants)`
        : `Processing ${jobs.length} images...`;
  }
}
