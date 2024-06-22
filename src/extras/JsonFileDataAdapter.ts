import fs from "node:fs";
import path from "node:path";

import type {
  ImgProcDataAdapter,
  ImgProcDataAdapterCriteria,
  ImgProcDataAdapterInitOptions,
  ImgProcFile,
  ImgProcFileRecord,
} from "../../src/types.js";

export interface JsonFileDataAdapterOptions {
  /**
   * Filename of json file
   * - If set to `:memory:`, in-memory mode is used.
   * @default "cache.json"
   */
  dbFile?: ":memory:" | string;
  /**
   * Directory to place json file
   * - Support the following placeholders:
   *   - `[root]`: Replace with `root` in Astro.
   *   - `[cacheDir]`: Replace with `cacheDir` in Astro.
   *   - `[imageCacheDir]`: Replace with `imageCacheDir` in the settings.
   * @default `[imageCacheDir]`
   */
  dbDir?: string;
  /**
   * Auto save debounce (milliseconds)
   */
  debounce?: number;
}

/**
 * Cache database using JSON file
 */
export class JsonFileDataAdapter implements ImgProcDataAdapter {
  public dbFile: string;
  public dbDir: string;
  public isInMemory: boolean;
  public debounce: number;

  public retentionPeriod: number | null = 10;
  public retentionCount: number | null = 1000 * 60 * 60 * 24 * 100;
  public dbPath = ":memory:";

  public files: ImgProcFileRecord[] = [];

  // biome-ignore lint/correctness/noUndeclaredVariables: Runtime matter
  private saveTimer?: NodeJS.Timeout | Timer | undefined;

  public constructor(options?: JsonFileDataAdapterOptions) {
    const {
      dbFile = "cache.json",
      dbDir = "[imageCacheDir]",
      debounce = 10000,
    } = options || {};

    this.dbFile = dbFile;
    this.dbDir = dbDir;
    this.debounce = debounce;
    this.isInMemory = dbFile === ":memory:";
  }

  public initialize(options: ImgProcDataAdapterInitOptions) {
    const {
      rootDir,
      cacheDir,
      imageCacheDir,
      retentionPeriod,
      retentionCount,
    } = options;
    this.retentionPeriod = retentionPeriod;
    this.retentionCount = retentionCount;

    const replacedDbDir = this.dbDir
      .replaceAll("[root]", rootDir)
      .replaceAll("[cacheDir]", cacheDir)
      .replaceAll("[imageCacheDir]", imageCacheDir);

    if (this.isInMemory) {
      this.dbPath = ":memory:";
      return;
    }

    this.dbPath = path.posix.normalize(
      path.resolve(replacedDbDir, this.dbFile).replaceAll("\\", "/"),
    );
    this.files = fs.existsSync(this.dbPath)
      ? JSON.parse(fs.readFileSync(this.dbPath).toString())
      : [];
  }

  private save() {
    if (this.isInMemory) {
      return;
    }
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(async () => {
      await fs.promises.writeFile(this.dbPath, JSON.stringify(this.files));
      this.saveTimer = undefined;
    }, this.debounce);
  }

  public fetch(criteria: ImgProcDataAdapterCriteria) {
    const { hash, source, profile } = criteria;

    return hash
      ? this.files.find((file) => file.hash === hash) || null
      : this.files.find(
          (file) => file.source === source && file.profile === profile,
        ) || null;
  }

  public list() {
    return new Set(this.files.map((file) => file.hash));
  }

  public insert(data: ImgProcFile) {
    this.files.push({
      ...data,
      countdown: this.retentionCount !== null ? this.retentionCount : 0,
      lastUsedAt: Date.now(),
    });

    this.save();
  }

  public updateMetadata(data: {
    hash: string;
    format: string;
    width: number;
    height: number;
    r?: number | undefined;
    g?: number | undefined;
    b?: number | undefined;
    expiresAt?: number | undefined;
  }) {
    const { hash, format, width, height, r, g, b, expiresAt } = data;

    const file = this.files.find((file) => file.hash === hash) || null;

    if (file) {
      Object.assign(file, { format, width, height, r, g, b, expiresAt });
      this.save();
    }
  }

  public delete(criteria: ImgProcDataAdapterCriteria) {
    const { hash, source, profile } = criteria;

    this.files = hash
      ? this.files.filter((file) => file.hash !== hash)
      : this.files.filter(
          (file) => file.source !== source && file.profile !== profile,
        );

    this.save();
  }

  public renew(criteria: ImgProcDataAdapterCriteria) {
    if (this.retentionPeriod === null && this.retentionCount === null) {
      return;
    }

    const file = this.fetch(criteria);
    if (!file) {
      return;
    }

    file.lastUsedAt = Date.now();
    if (this.retentionCount !== null) {
      file.countdown = this.retentionCount;
    } else {
      file.countdown = 0;
    }

    this.save();
  }

  public countdown() {
    if (this.retentionCount === null) {
      return;
    }

    this.files = this.files.map((file) => {
      file.countdown -= 1;
      return file;
    });

    this.save();
  }

  public deleteExpiredRecords(now: number = Date.now()) {
    const { retentionPeriod, retentionCount } = this;

    if (retentionPeriod === null && retentionCount === null) {
      return null;
    }

    const beforeHashes = new Set(this.list());

    this.files = this.files.filter((file) => {
      const periodCondition =
        retentionPeriod === null || file.lastUsedAt >= now - retentionPeriod;
      const countCondition = retentionCount === null || file.countdown >= 0;
      return periodCondition && countCondition;
    });

    const afterHashes = new Set(this.list());
    const deletedHashes = [...beforeHashes].filter(
      (hash) => !afterHashes.has(hash),
    );

    this.save();

    return deletedHashes.length > 0 ? new Set(deletedHashes) : null;
  }

  public close() {
    if (this.isInMemory) {
      return;
    }
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    fs.writeFileSync(this.dbPath, JSON.stringify(this.files));
  }
}
