import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { validateFeatureManifest } from "./index.js";

describe("feature manifest validation", () => {
  it("accepts the import-center manifest", async () => {
    const sourceDirectory = dirname(fileURLToPath(import.meta.url));
    const manifestPath = resolve(sourceDirectory, "../../../features/import-center/feature.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as unknown;

    expect(validateFeatureManifest(manifest)).toEqual({ valid: true, errors: [] });
  });

  it("rejects unsupported schema versions and unknown fields", () => {
    const result = validateFeatureManifest({
      schemaVersion: "1.0",
      id: "import-center",
      version: "0.1.0",
      displayName: "Data Import Center",
      maturity: "experimental",
      requires: [],
      effects: [],
      unsafe: true,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
