import { beforeAll, describe, expect, test } from "bun:test";
import fs from "node:fs";

import { afterAll } from "vitest";
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
import { BunSqliteDataAdapter } from "./BunSqliteDataAdapter.js";

let db: BunSqliteDataAdapter;

describe.skipIf(typeof Bun === "undefined")(
  "Unit/extras/BunSqliteDataAdapter",
  () => {
    beforeAll(() => {
      fs.rmSync("./__test__/cache.sqlite", { force: true });
    });

    afterAll(() => {
      fs.rmSync("./__test__/cache.sqlite", { force: true });
    });

    test("initialize", () => {
      db = new BunSqliteDataAdapter({
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
      // Fetch source
      expect(db.fetch({ hash: "mock-source-1-hash" })).toMatchObject({
        ...mockSource1,
        lastUsedAt: expect.any(Number),
        countdown: 0,
      });
    });

    test("fetch source (null)", () => {
      expect(db.fetch({ hash: "mock-source-null" })).toBeNull();
    });

    test("fetch variant", () => {
      // Fetch variant
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

      // Update result
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
      // Countdown
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
      // Renew
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

    test("expires", () => {
      // Expire
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
      // Delete
      db.delete({ hash: "mock-source-1-hash" });
      db.delete({
        source: "mock-variant-1-source",
        profile: "mock-variant-1-profile",
      });
      expect(db.list()).toEqual(new Set(["mock-source-2-hash"]));
    });

    test("close", async () => {
      expect(fs.existsSync(db.dbPath)).toBeTruthy();
      db.close();
      await sleep(100);
      expect(fs.existsSync(db.dbPath)).toBeTruthy();
      fs.rmSync(db.dbPath);
    });

    test("in-memory", () => {
      db = new BunSqliteDataAdapter({
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
  },
);
