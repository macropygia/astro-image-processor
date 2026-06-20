import { blue, dim, magenta } from 'kleur/colors';
import ora, { type Ora } from 'ora';

import { componentTypeToTag } from '../../const.js';

type Job = {
  componentType: 'img' | 'picture' | 'background';
  src: string;
  variantCompleted: number;
  variantTotal: number;
};

export type ImgProcSpinnerHandle = {
  set text(value: string);
  setVariantProgress(completed: number, total: number): void;
  succeed(message?: string): void;
  fail(message?: string): void;
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

  succeed(message?: string) {
    this.manager.succeed(this.id, message);
  }

  fail(message?: string) {
    this.manager.fail(this.id, message);
  }
}

export class SharedSpinner {
  #ora: Ora;
  #jobs = new Map<string, Job>();
  #nextId = 0;

  constructor() {
    this.#ora = ora('Processing...');
    this.#ora.prefixText = blue('[astro-image-processor]');
  }

  create(
    componentType: 'img' | 'picture' | 'background',
    src: string,
  ): { id: string; spinner: ImgProcSpinnerHandle } {
    const id = String(++this.#nextId);
    this.#jobs.set(id, {
      componentType,
      src,
      variantCompleted: 0,
      variantTotal: 0,
    });
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

  succeed(id: string, message?: string) {
    this.#jobs.delete(id);
    if (this.#jobs.size === 0) {
      this.#ora.succeed(message ?? 'Completed');
      return;
    }
    this.#refresh();
  }

  fail(id: string, message?: string) {
    this.#jobs.delete(id);
    if (this.#jobs.size === 0) {
      this.#ora.fail(message ?? 'Failed');
      return;
    }
    this.#refresh();
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
