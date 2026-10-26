import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { inspectProject } from "./inspect.js";

const temporaryDirectories: string[] = [];

async function createProject(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "featurekit-inspect-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(async (directory) => {
      await rm(directory, { recursive: true, force: true });
    }),
  );
});

describe("inspectProject", () => {
  it("reports evidence and preserves an eligible project directory", async () => {
    const projectDirectory = await createProject();
    await mkdir(join(projectDirectory, "app"));
    await mkdir(join(projectDirectory, "src", "lib"), { recursive: true });
    await writeFile(
      join(projectDirectory, "package.json"),
      JSON.stringify({
        dependencies: {
          next: "16.4.3",
          react: "19.3.1",
          "react-dom": "19.3.1",
          "@supabase/supabase-js": "2.118.0",
        },
        devDependencies: { typescript: "7.0.2" },
      }),
    );
    await writeFile(join(projectDirectory, "next.config.ts"), "export default {};\n");
    await writeFile(join(projectDirectory, "tsconfig.json"), "{}\n");
    await writeFile(join(projectDirectory, "src", "lib", "supabase.ts"), 'import type { SupabaseClient } from "@supabase/supabase-js";\n');
    await writeFile(join(projectDirectory, ".env.local"), "SUPABASE_SECRET=do-not-print\n");

    const packageBefore = await readFile(join(projectDirectory, "package.json"), "utf8");
    const environmentBefore = await readFile(join(projectDirectory, ".env.local"), "utf8");
    const report = await inspectProject(projectDirectory);

    expect(report.errors).toEqual([]);
    expect(report.supportAssessment).toBe("not-determined");
    expect(report.capabilities.nextjs.evidence).toContainEqual(
      expect.objectContaining({ path: "package.json", kind: "package-dependency" }),
    );
    expect(report.capabilities.supabase.evidence).toContainEqual(
      expect.objectContaining({ path: "src/lib/supabase.ts", kind: "source-import" }),
    );
    expect(JSON.stringify(report)).not.toContain("do-not-print");
    expect(await readFile(join(projectDirectory, "package.json"), "utf8")).toBe(packageBefore);
    expect(await readFile(join(projectDirectory, ".env.local"), "utf8")).toBe(environmentBefore);
  });

  it("reports malformed package metadata without throwing", async () => {
    const projectDirectory = await createProject();
    await writeFile(join(projectDirectory, "package.json"), "{ malformed");

    const report = await inspectProject(projectDirectory);

    expect(report.errors).toHaveLength(1);
    expect(report.errors[0]).toContain("Unable to parse package.json");
    expect(report.supportAssessment).toBe("not-determined");
  });

  it("reports missing package metadata", async () => {
    const projectDirectory = await createProject();

    const report = await inspectProject(projectDirectory);

    expect(report.errors).toHaveLength(1);
    expect(report.errors).toEqual(["package.json is missing."]);
  });
});
