import http from "node:http";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { sleep } from "#mock/utils.js";
import { getBufferFromRemoteUrl } from "./getBufferFromRemoteUrl.js";

describe("Unit/api/utils/getBufferFromRemoteUrl", () => {
  const server = http.createServer(async (req, res) => {
    const { url } = req;

    if (url === "/image/jpeg") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "image/jpeg");
      res.end();
    } else if (url === "/status/404") {
      res.statusCode = 404;
      res.end();
    } else {
      await sleep(500);
      res.end();
    }
  });

  beforeAll(() => {
    server.listen(4320);
  });

  afterAll(() => {
    server.close();
  });

  test.concurrent("default", async () => {
    const { buffer, expiresAt } = await getBufferFromRemoteUrl(
      "http://localhost:4320/image/jpeg",
      1000,
    );

    expect(buffer instanceof Buffer).toBeTruthy();
    expect(expiresAt).toBeUndefined();
  });

  test.concurrent("404", async () => {
    await expect(
      getBufferFromRemoteUrl("http://localhost:4320/status/404", 1000),
    ).rejects.toThrowError(
      "Failed to download: http://localhost:4320/status/404 (404)",
    );
  });

  test.concurrent("timeout", async () => {
    await expect(
      getBufferFromRemoteUrl("http://localhost:4320/throw", 100),
    ).rejects.toThrowError("Fetch timeout");
  });
});
