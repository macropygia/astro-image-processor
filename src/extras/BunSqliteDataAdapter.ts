import { Database, type Statement } from "bun:sqlite";
import path from "node:path";

import type {
  ImgProcDataAdapter,
  ImgProcDataAdapterCriteria,
  ImgProcDataAdapterInitOptions,
  ImgProcFile,
  ImgProcFileRecord,
} from "../types.js";

export interface BunSqliteDataAdapterOptions {
  /**
   * Filename of database file
   * - If set to `:memory:`, in-memory mode is used.
   * @default "cache.sqlite"
   */
  dbFile?: ":memory:" | string;
  /**
   * Directory to place json file
   * - Support the following placeholders:
   *   - `[root]`: Replace with `root` in Astro.
   *   - `[cacheDir]`: Replace with `cacheDir` in Astro.
   *   - `[imageCacheDir]`: Replace with `imageDir` in the settings.
   * @default `[imageCacheDir]`
   */
  dbDir?: string;
  /**
   * Table name
   * @default "cache"
   */
  table?: string;
  /**
   * Use WAL mode
   * @default false
   */
  useWAL?: boolean;
}

export type BunSqliteDataAdapterRecord = Record<
  keyof ImgProcFileRecord,
  string | number | null
>;

export type BunSqliteDataAdapterParams = Record<
  `$${keyof ImgProcFileRecord}`,
  string | number | null
>;

/**
 * Cache database using JSON file
 */
export class BunSqliteDataAdapter implements ImgProcDataAdapter {
  public dbFile: string;
  public dbDir: string;
  public table: string;
  public useWAL: boolean;
  public isInMemory: boolean;

  public retentionPeriod: number | null = 10;
  public retentionCount: number | null = 1000 * 60 * 60 * 24 * 100;
  public dbPath = ":memory:";

  public db!: Database;
  private fetchQuery!: Statement<BunSqliteDataAdapterRecord, [string]>;
  private fetchVariantQuery!: Statement<
    BunSqliteDataAdapterRecord,
    [{ $source: string; $profile: string }]
  >;
  private listQuery!: Statement<{ hash: string }, []>;
  private insertQuery!: Statement<void, [BunSqliteDataAdapterParams]>;
  // private updateQuery!: Statement<void, [Partial<BunSqliteDataAdapterParams>]>;
  private updateDominant!: Statement<
    void,
    [
      {
        $hash: string;
        $format: string;
        $width: number;
        $height: number;
        $r: number | null;
        $g: number | null;
        $b: number | null;
        $expiresAt: number | null;
      },
    ]
  >;
  private deleteQuery!: Statement<void, [string]>;
  private deleteVariantQuery!: Statement<
    void,
    [{ $source: string; $profile: string }]
  >;
  private renewQuery!: Statement<
    void,
    [{ $hash: string; $lastUsedAt: number; $countdown: number }]
  >;
  private renewVariantQuery!: Statement<
    void,
    [
      {
        $source: string;
        $profile: string;
        $lastUsedAt: number;
        $countdown: number;
      },
    ]
  >;

  private countdownQuery!: Statement<void, []>;
  private deletePeriodExpiredQuery!: Statement<void, [number]>;
  private deleteCountExpiredQuery!: Statement<void, []>;
  private deleteBothExpiredQuery!: Statement<void, [number]>;

  public constructor(options?: BunSqliteDataAdapterOptions) {
    const {
      dbFile = "cache.sqlite",
      dbDir = "[imageCacheDir]",
      table = "cache",
      useWAL = false,
    } = options || {};

    this.dbFile = dbFile;
    this.dbDir = dbDir;
    this.table = table;
    this.useWAL = useWAL;
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

    if (this.isInMemory) {
      this.dbPath = ":memory:";
    }

    const db = new Database(this.dbPath);

    if (this.useWAL && !this.isInMemory) {
      db.exec("PRAGMA journal_mode = WAL;");
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.table}
      (
        "hash" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "width" INTEGER NOT NULL,
        "height" INTEGER,
        "r" INTEGER,
        "g" INTEGER,
        "b" INTEGER,
        "source" TEXT NOT NULL,
        "profile" TEXT,
        "format" TEXT NOT NULL,
        "expiresAt" INTEGER,
        "lastUsedAt" INTEGER,
        "countdown" INTEGER,
        "base64" TEXT
      )
      ;
    `);
    db.exec(`
      CREATE INDEX IF NOT EXISTS index_hash ON ${this.table} (hash)
      ;
    `);
    db.exec(`
      CREATE INDEX IF NOT EXISTS index_source ON ${this.table} (source)
      ;
    `);
    db.exec(`
      CREATE INDEX IF NOT EXISTS index_category ON ${this.table} (category)
      ;
    `);
    db.exec(`
      CREATE INDEX IF NOT EXISTS index_lastUsedAt ON ${this.table} (lastUsedAt)
      ;
    `);
    db.exec(`
      CREATE INDEX IF NOT EXISTS index_countdown ON ${this.table} (countdown)
      ;
    `);

    this.fetchQuery = db.query(`
      SELECT * FROM ${this.table}
      WHERE hash = $hash
      ;
    `);

    this.fetchVariantQuery = db.query(`
      SELECT * FROM ${this.table}
      WHERE source = $source
      AND profile = $profile
      ;
    `);

    this.listQuery = db.query(`
      SELECT hash FROM ${this.table}
      ;
    `);

    this.insertQuery = db.query(`
      INSERT INTO ${this.table}
        (
          hash, category, width, height, r, g, b, source, profile, format, expiresAt, lastUsedAt, countdown, base64
        )
      VALUES
        (
          $hash, $category, $width, $height, $r, $g, $b, $source, $profile, $format, $expiresAt, $lastUsedAt, $countdown, $base64
        )
      ;
    `);

    this.updateDominant = db.query(`
      UPDATE ${this.table}
      SET
        width = $width,
        height = $height,
        format = $format,
        r = $r,
        g = $g,
        b = $b,
        expiresAt = $expiresAt
      WHERE hash = $hash
      ;
    `);

    this.deleteQuery = db.query(`
      DELETE FROM ${this.table}
      WHERE hash = $hash
      ;
    `);

    this.deleteVariantQuery = db.query(`
      DELETE FROM ${this.table}
      WHERE source = $source
      AND profile = $profile
      ;
    `);

    this.renewQuery = db.query(`
      UPDATE ${this.table}
      SET
        lastUsedAt = $lastUsedAt,
        countdown = $countdown
      WHERE hash = $hash
      ;
    `);

    this.renewVariantQuery = db.query(`
      UPDATE ${this.table}
      SET
        lastUsedAt = $lastUsedAt,
        countdown = $countdown
      WHERE source = $source
      AND profile = $profile
      ;
    `);

    this.countdownQuery = db.query(`
      UPDATE ${this.table}
      SET
        countdown = countdown - 1
      ;
    `);

    this.deletePeriodExpiredQuery = db.query(`
      DELETE FROM ${this.table}
      WHERE lastUsedAt < ?1
      ;
    `);
    this.deleteCountExpiredQuery = db.query(`
      DELETE FROM ${this.table}
      WHERE countdown < 0
      ;
    `);
    this.deleteBothExpiredQuery = db.query(`
      DELETE FROM ${this.table}
      WHERE lastUsedAt < ?1
      AND countdown < 0
      ;
    `);

    this.db = db;
  }

  protected dataToParams(
    data: Partial<ImgProcFileRecord> & { hash: string },
  ): BunSqliteDataAdapterParams {
    const fields: Partial<BunSqliteDataAdapterParams> = {
      // $hash: null,
      $category: null,
      $width: null,
      $height: null,
      $r: null,
      $g: null,
      $b: null,
      $source: null,
      $profile: null,
      $format: null,
      $expiresAt: null,
      $lastUsedAt: null,
      $countdown: null,
      $base64: null,
    };
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields[`$${key}` as keyof BunSqliteDataAdapterParams] = value;
      }
    }
    return fields as BunSqliteDataAdapterParams;
  }

  protected recordToData(
    record: BunSqliteDataAdapterRecord,
  ): ImgProcFileRecord {
    const data = {} as Record<keyof ImgProcFileRecord, string | number>;
    for (const [key, value] of Object.entries(record) as [
      keyof ImgProcFileRecord,
      string | number | null,
    ][]) {
      if (value !== null) {
        data[key] = value;
      }
    }
    return data as ImgProcFileRecord;
  }

  public fetch(criteria: ImgProcDataAdapterCriteria) {
    const result = hasHash(criteria)
      ? this.fetchQuery.get(criteria.hash)
      : this.fetchVariantQuery.get({
          $source: criteria.source,
          $profile: criteria.profile,
        });
    return result ? this.recordToData(result) : null;
  }

  public list() {
    const result = this.listQuery.all();
    return new Set(result.map((res) => res.hash));
  }

  public insert(data: ImgProcFile) {
    try {
      this.insertQuery.run(
        this.dataToParams({
          ...data,
          countdown: this.retentionCount !== null ? this.retentionCount : 0,
          lastUsedAt: Date.now(),
        }),
      );
    } catch (_err: unknown) {
      throw new Error("Insert failed");
    }
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
    this.updateDominant.run({
      $hash: data.hash,
      $format: data.format,
      $width: data.width,
      $height: data.height,
      $r: data.r || null,
      $g: data.g || null,
      $b: data.b || null,
      $expiresAt: data.expiresAt || null,
    });
  }

  public delete(criteria: ImgProcDataAdapterCriteria) {
    hasHash(criteria)
      ? this.deleteQuery.run(criteria.hash)
      : this.deleteVariantQuery.run({
          $source: criteria.source,
          $profile: criteria.profile,
        });
  }

  public renew(criteria: ImgProcDataAdapterCriteria) {
    if (this.retentionPeriod === null && this.retentionCount === null) {
      return;
    }

    const params = {
      $lastUsedAt: Date.now(),
      $countdown: this.retentionCount !== null ? this.retentionCount : 0,
    };

    hasHash(criteria)
      ? this.renewQuery.run({ $hash: criteria.hash, ...params })
      : this.renewVariantQuery.run({
          $source: criteria.source,
          $profile: criteria.profile,
          ...params,
        });
  }

  public countdown() {
    if (this.retentionCount === null) {
      return;
    }

    this.countdownQuery.run();
  }

  public deleteExpiredRecords(now: number = Date.now()) {
    const { retentionPeriod, retentionCount } = this;

    const beforeHashes = new Set(this.list());

    if (retentionPeriod !== null && retentionCount !== null) {
      this.deleteBothExpiredQuery.run(now);
    }

    if (retentionPeriod !== null && retentionCount === null) {
      this.deletePeriodExpiredQuery.run(now);
    }

    if (retentionPeriod === null && retentionCount !== null) {
      this.deleteCountExpiredQuery.run();
    }

    const afterHashes = new Set(this.list());
    const deletedHashes = [...beforeHashes].filter(
      (hash) => !afterHashes.has(hash),
    );
    return deletedHashes.length > 0 ? new Set(deletedHashes) : null;
  }

  public close() {
    this.db.close();
  }
}

function hasHash(
  criteria: ImgProcDataAdapterCriteria,
): criteria is { hash: string } {
  return typeof (criteria as { hash: string }).hash === "string";
}
