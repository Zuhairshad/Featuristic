import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..", "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.(test|itest)\.ts$/.test(name) ? [path] : [];
  });
}

function filesMatching(pattern: RegExp): string[] {
  return [...sourceFiles(join(root, "app")), ...sourceFiles(join(root, "src"))]
    .filter((file) => pattern.test(readFileSync(file, "utf8")))
    .map((file) => relative(root, file).split(sep).join("/"))
    .sort();
}

/**
 * The service-role worker consumes a GLOBAL queue, so no user-session code path may start it: a tenant
 * admin could otherwise advance another tenant's import. Only the secret-authenticated operator
 * endpoint may. This guard fails if a page, Server Action, or user-facing route imports the runner.
 */
describe("service-role worker exposure", () => {
  it("is imported only by the operator-authenticated internal endpoint", () => {
    expect(filesMatching(/run-worker["']/)).toEqual(["app/api/internal/import-worker/route.ts"]);
  });

  it("builds the service-role client only inside the worker runner", () => {
    expect(filesMatching(/service-client["']/)).toEqual(["src/server/run-worker.ts"]);
  });

  it("has no Server Action that can start the worker", () => {
    const serverActionFiles = filesMatching(/["']use server["']/);
    for (const file of serverActionFiles) {
      expect(readFileSync(join(root, file), "utf8")).not.toMatch(/runImportWorkerOnce|run-worker|service-client/);
    }
  });
});
