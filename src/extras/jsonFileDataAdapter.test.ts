import fs from "node:fs";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import {
  mockPlaceholder1,
  mockSource1,
  mockSource2,
  mockSource3,
  mockSource4,
  mockVariant1,
  mockVariant2,
} from "#mock/mock.js";
import { sleep } from "#mock/utils.js";
import { JsonFileDataAdapter } from "./JsonFileDataAdapter.js";

let db: JsonFileDataAdapter;

describe("Unit/extras/JsonFileDataAdapter", () => {
  beforeAll(() => {
    fs.rmSync("./__test__/cache.json", { force: true });
  });

  afterAll(() => {
    fs.rmSync("./__test__/cache.json", { force: true });
  });

  test("initialize", () => {
    db = new JsonFileDataAdapter({
      dbDir: "./__test__",
    });

    db.initialize({
      rootDir: "mock-root-dir",
      cacheDir: "mock-cacheDir-dir",
      imageCacheDir: "mock-imageCacheDir-dir",
      retentionPeriod: null,
      retentionCount: 0,
    });

    // Insert
    db.insert(mockSource1);
    db.insert(mockSource2);
    db.insert(mockSource3);
    db.insert(mockSource4);
    db.insert(mockPlaceholder1);
    db.insert(mockVariant1);
    db.insert(mockVariant2);
  });

  test("list", () => {
    // List
    expect(db.list()).toEqual(
      new Set([
        "mock-source-1-hash",
        "mock-source-2-hash",
        "mock-source-3-hash",
        "mock-source-4-hash",
        "mock-placeholder-1-hash",
        "mock-variant-1-hash",
        "mock-variant-2-hash",
      ]),
    );
  });

  test("fetch source", () => {
    expect(db.fetch({ hash: "mock-source-1-hash" })).toMatchObject({
      ...mockSource1,
      lastUsedAt: expect.any(Number),
      countdown: 0,
    });
  });

  test("fetch source (null)", () => {
    expect(db.fetch({ hash: "mock-source-0-hash" })).toBeNull();
  });

  test("fetch variant", () => {
    expect(
      db.fetch({
        source: "mock-variant-1-source",
        profile: "mock-variant-1-profile",
      }),
    ).toMatchObject({
      ...mockVariant1,
      lastUsedAt: expect.any(Number),
      countdown: 0,
    });
  });

  test("fetch variant (null)", () => {
    expect(
      db.fetch({
        source: "mock-variant-0-source",
        profile: "mock-variant-0-profile",
      }),
    ).toBeNull();
  });

  test("updateMetadata", () => {
    db.updateMetadata({
      hash: "mock-source-1-hash",
      format: "jpeg",
      width: 1280,
      height: 960,
      r: 5,
      g: 6,
      b: 7,
    });

    expect(db.fetch({ hash: "mock-source-1-hash" })).toEqual({
      b: 7,
      category: "source",
      countdown: 0,
      expiresAt: undefined,
      format: "jpeg",
      g: 6,
      hash: "mock-source-1-hash",
      height: 960,
      lastUsedAt: expect.any(Number),
      r: 5,
      source: "mock-source-1-source",
      width: 1280,
    });
  });

  test("countdown", () => {
    db.countdown();
    expect(db.fetch({ hash: "mock-source-1-hash" })?.countdown).toBe(-1);
    expect(
      db.fetch({
        source: "mock-variant-1-source",
        profile: "mock-variant-1-profile",
      })?.countdown,
    ).toBe(-1);
  });

  test("renew", () => {
    db.renew({ hash: "mock-source-1-hash" });
    expect(db.fetch({ hash: "mock-source-1-hash" })?.countdown).toBe(0);
    db.renew({
      source: "mock-variant-1-source",
      profile: "mock-variant-1-profile",
    });
    expect(
      db.fetch({
        source: "mock-variant-1-source",
        profile: "mock-variant-1-profile",
      })?.countdown,
    ).toBe(0);
  });

  test("expires/count", () => {
    db.renew({ hash: "mock-source-2-hash" });
    expect(db.deleteExpiredRecords()).toEqual(
      new Set([
        "mock-source-3-hash",
        "mock-source-4-hash",
        "mock-placeholder-1-hash",
        "mock-variant-2-hash",
      ]),
    );
  });

  test("expires (null)", () => {
    expect(db.deleteExpiredRecords()).toBeNull();
  });

  test("delete", () => {
    db.delete({ hash: "mock-source-1-hash" });
    db.delete({
      source: "mock-variant-1-source",
      profile: "mock-variant-1-profile",
    });
    expect(db.list()).toEqual(new Set(["mock-source-2-hash"]));
  });

  test("close", async () => {
    expect(fs.existsSync(db.dbPath)).toBeFalsy();
    db.close();
    await sleep(100);
    expect(fs.existsSync(db.dbPath)).toBeTruthy();
  });

  test("load existing file", () => {
    db = new JsonFileDataAdapter({
      dbDir: "./__test__",
    });

    db.initialize({
      rootDir: "mock-root-dir",
      cacheDir: "mock-cacheDir-dir",
      imageCacheDir: "mock-imageCacheDir-dir",
      retentionPeriod: null,
      retentionCount: 0,
    });

    expect(db.list()).toEqual(new Set(["mock-source-2-hash"]));
    db.close();
  });

  test("in-memory", () => {
    db = new JsonFileDataAdapter({
      dbFile: ":memory:",
    });
    db.initialize({
      rootDir: "mock-root-dir",
      cacheDir: "mock-cacheDir-dir",
      imageCacheDir: "mock-imageCacheDir-dir",
      retentionPeriod: null,
      retentionCount: null,
    });
  });

  test("retention disabled", () => {
    expect(db.deleteExpiredRecords()).toBeNull();
    db.close();
  });

  /*
  test("expires/period)", () => {});

  test("expired (count)", () => {});

  */
});
