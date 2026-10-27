import { afterEach, describe, expect, it } from "vitest";
import { workerSecret } from "./env";

const original = process.env.IMPORT_WORKER_SECRET;
afterEach(() => {
  if (original === undefined) delete process.env.IMPORT_WORKER_SECRET;
  else process.env.IMPORT_WORKER_SECRET = original;
});

describe("workerSecret", () => {
  it("is disabled when unset or shorter than 32 characters", () => {
    delete process.env.IMPORT_WORKER_SECRET;
    expect(workerSecret()).toBeNull();
    process.env.IMPORT_WORKER_SECRET = "x".repeat(31);
    expect(workerSecret()).toBeNull();
  });

  it("is enabled at 32 characters", () => {
    process.env.IMPORT_WORKER_SECRET = "x".repeat(32);
    expect(workerSecret()).toBe("x".repeat(32));
  });
});
