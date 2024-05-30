import path from "node:path";

import Loki, { LokiMemoryAdapter, type Collection } from "lokijs";

import type {
  ImgProcDataAdapter,
  ImgProcDataAdapterCriteria,
  ImgProcDataAdapterInitOptions,
  ImgProcFile,
  ImgProcFileRecord,
} from "../types.js";

export interface LokiDataAdapterOptions {
  /**
   * Filename of database file
   * - If set to `:memory:`, in-memory mode is used.
   * @default "cache.db"
   */
  dbFile?: ":memory:" | string;
  /**
   * Directory to place database file
   * - Support the following placeholders:
   *   - `[root]`: Replace with `root` in Astro.
   *   - `[cacheDir]`: Replace with `cacheDir` in Astro.
   *   - `[imageCacheDir]`: Replace with `imageDir` in the settings.
   * @default `[imageCacheDir]`
   */
  dbDir?: string;
  /**
   * Enable auto save
   * @default true
   */
  autosave?: true;
  /**
   * Auto save interval (milliseconds)
   * @default 10000 (10s)
   */
  autosaveInterval?: 10000;
}

/**
 * Cache database using LokiJS
 * - Requires [lokijs](https://www.npmjs.com/package/lokijs)
 */
export class LokiDataAdapter implements ImgProcDataAdapter {
  public dbFile: string;
  public dbDir: string;
  public isInMemory: boolean;
  public autosave: boolean;
  public autosaveInterval: number;

  public retentionPeriod: number | null = 10;
  public retentionCount: number | null = 1000 * 60 * 60 * 24 * 100;
  public dbPath = ":memory:";

  public db!: Loki;
  public files!: Collection<ImgProcFileRecord>;

  public constructor(options?: LokiDataAdapterOptions) {
    const {
      dbFile = "cache.db",
      dbDir = "[imageCacheDir]",
      autosave = true,
      autosaveInterval = 10000,
    } = options || {};

    this.dbFile = dbFile;
    this.dbDir = dbDir;
    this.isInMemory = dbFile === ":memory:";
    this.autosave = autosave;
    this.autosaveInterval = autosaveInterval;
  }

  /**
   * Async part of constructor
   */
  public async initialize(options: ImgProcDataAdapterInitOptions) {
    const {
      rootDir,
      cacheDir,
      imageCacheDir,
      retentionPeriod,
      retentionCount,
    } = options;
    this.retentionPeriod = retentionPeriod;
    this.retentionCount = retentionCount;

    await new Promise<void>((resolve, _reject) => {
      if (this.isInMemory) {
        this.db = new Loki("cache.db", {
          adapter: new LokiMemoryAdapter(),
        });
        this.dbPath = ":memory:";

        this.files =
          this.db.getCollection("files") ||
          this.db.addCollection("files", {
            indices: ["hash", "source", "category", "lastUsedAt", "countdown"],
          });

        resolve();
      } else {
        const replacedDbDir = path.posix.normalize(
          this.dbDir
            .replaceAll("[root]", rootDir)
            .replaceAll("[cacheDir]", cacheDir)
            .replaceAll("[imageCacheDir]", imageCacheDir)
            .replaceAll("\\", "/"),
        );
        this.dbPath = path.posix.normalize(
          path.resolve(replacedDbDir, this.dbFile).replaceAll("\\", "/"),
        );
        this.db = new Loki(this.dbPath, {
          autoload: true,
          autoloadCallback: (err) => {
            if (err) {
              throw err;
            }

            this.files =
              this.db.getCollection("files") ||
              this.db.addCollection("files", {
                indices: [
                  "hash",
                  "source",
                  "category",
                  "lastUsedAt",
                  "countdown",
                ],
              });

            resolve();
          },
          autosave: this.autosave,
          autosaveInterval: this.autosaveInterval,
        });
      }
    });
  }

  private getQuery(
    criteria: ImgProcDataAdapterCriteria,
    // biome-ignore lint/correctness/noUndeclaredVariables: @types/loki issue
  ): LokiQuery<ImgProcFileRecord> {
    const { hash, source, profile } = criteria;
    return hash
      ? { hash: { $eq: hash } }
      : {
          source: { $eq: source },
          profile: { $eq: profile },
        };
  }

  public fetch(criteria: ImgProcDataAdapterCriteria) {
    const result = this.files.findOne(this.getQuery(criteria));

    if (!result) {
      return null;
    }

    const { $loki, meta, ...data } = result;

    return data;
  }

  public list() {
    return new Set(
      this.files
        .chain()
        .data()
        .map((file) => file.hash),
    );
  }

  public insert(data: ImgProcFile) {
    this.files.insert({
      ...data,
      countdown: this.retentionCount !== null ? this.retentionCount : 0,
      lastUsedAt: Date.now(),
    });
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
    this.files
      .chain()
      .find({ hash: { $eq: hash } })
      .update((obj) => {
        Object.assign(obj, { format, width, height, r, g, b, expiresAt });
        return obj;
      });
  }

  public delete(criteria: ImgProcDataAdapterCriteria) {
    this.files.chain().find(this.getQuery(criteria)).remove();
  }

  public renew(criteria: ImgProcDataAdapterCriteria) {
    if (this.retentionPeriod === null && this.retentionCount === null) {
      return;
    }

    this.files
      .chain()
      .find(this.getQuery(criteria))
      .update((obj) => {
        obj.lastUsedAt = Date.now();
        if (this.retentionCount !== null) {
          obj.countdown = this.retentionCount;
        } else {
          obj.countdown = 0;
        }
        return obj;
      });
  }

  public countdown() {
    if (this.retentionCount === null) {
      return;
    }

    this.files
      .chain()
      .find()
      .update((obj) => {
        obj.countdown -= 1;
        return obj;
      });
  }

  public deleteExpiredRecords(now: number = Date.now()) {
    const { retentionPeriod, retentionCount } = this;

    if (retentionPeriod === null && retentionCount === null) {
      return null;
    }

    const beforeHashes = new Set(this.list());

    // biome-ignore lint/correctness/noUndeclaredVariables: @types/loki issue
    const query: LokiQuery<ImgProcFileRecord> = {};
    if (retentionPeriod !== null) {
      query.lastUsedAt = { $lt: now - retentionPeriod };
    }
    if (retentionCount !== null) {
      query.countdown = { $lt: 0 };
    }

    this.files.chain().find(query).remove();

    const afterHashes = new Set(this.list());
    const deletedHashes = [...beforeHashes].filter(
      (hash) => !afterHashes.has(hash),
    );
    return deletedHashes.length > 0 ? new Set(deletedHashes) : null;
  }

  /** Save and close database */
  public close() {
    this.db.save();
    this.db.close();
  }
}
