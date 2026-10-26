import { lstat, readdir, readFile } from "node:fs/promises";
import { basename, relative, resolve } from "node:path";

export type EvidenceKind = "package-dependency" | "config-file" | "source-import";

export interface Evidence {
  kind: EvidenceKind;
  path: string;
  detail: string;
}

export interface CapabilityReport {
  evidence: Evidence[];
  unknowns: string[];
}

export interface InspectionReport {
  schemaVersion: "0.1";
  targetDirectory: string;
  supportAssessment: "not-determined";
  capabilities: {
    nextjs: CapabilityReport;
    react: CapabilityReport;
    typescript: CapabilityReport;
    supabase: CapabilityReport;
  };
  errors: string[];
}

type PackageManifest = Record<string, unknown>;

const PACKAGE_SECTIONS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
] as const;

const CONFIGURATION_FILES = [
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "tsconfig.json",
  "supabase/config.toml",
] as const;

const SOURCE_DIRECTORIES = ["app", "src", "lib"] as const;
const SOURCE_FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const MAX_SOURCE_FILES = 100;
const MAX_SOURCE_FILE_BYTES = 256 * 1024;

function emptyCapability(): CapabilityReport {
  return { evidence: [], unknowns: [] };
}

function createReport(targetDirectory: string): InspectionReport {
  return {
    schemaVersion: "0.1",
    targetDirectory,
    supportAssessment: "not-determined",
    capabilities: {
      nextjs: emptyCapability(),
      react: emptyCapability(),
      typescript: emptyCapability(),
      supabase: emptyCapability(),
    },
    errors: [],
  };
}

function toRelativePath(projectDirectory: string, path: string): string {
  const result = relative(projectDirectory, path);
  return result === "" ? "." : result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addDependencyEvidence(
  capability: CapabilityReport,
  packageManifest: PackageManifest,
  dependencyNames: readonly string[],
): void {
  for (const section of PACKAGE_SECTIONS) {
    const dependencies = packageManifest[section];

    if (!isRecord(dependencies)) {
      continue;
    }

    for (const dependencyName of dependencyNames) {
      const version = dependencies[dependencyName];

      if (typeof version === "string") {
        capability.evidence.push({
          kind: "package-dependency",
          path: "package.json",
          detail: `${dependencyName} is declared in ${section} as ${version}`,
        });
      }
    }
  }
}

async function addConfigurationEvidence(projectDirectory: string, report: InspectionReport): Promise<void> {
  for (const configurationFile of CONFIGURATION_FILES) {
    const fullPath = resolve(projectDirectory, configurationFile);

    try {
      const status = await lstat(fullPath);

      if (!status.isFile() || status.isSymbolicLink()) {
        continue;
      }
    } catch {
      continue;
    }

    const evidence: Evidence = {
      kind: "config-file",
      path: configurationFile,
      detail: `${configurationFile} exists`,
    };

    if (configurationFile.startsWith("next.config")) {
      report.capabilities.nextjs.evidence.push(evidence);
    } else if (configurationFile === "tsconfig.json") {
      report.capabilities.typescript.evidence.push(evidence);
    } else {
      report.capabilities.supabase.evidence.push(evidence);
    }
  }
}

async function collectSourceFiles(directory: string, files: string[]): Promise<void> {
  if (files.length >= MAX_SOURCE_FILES) {
    return;
  }

  const directoryStatus = await lstat(directory).catch(() => undefined);

  if (directoryStatus === undefined) {
    return;
  }

  if (!directoryStatus.isDirectory() || directoryStatus.isSymbolicLink()) {
    return;
  }

  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    if (files.length >= MAX_SOURCE_FILES || entry.isSymbolicLink()) {
      continue;
    }

    const entryPath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      await collectSourceFiles(entryPath, files);
      continue;
    }

    if (entry.isFile() && SOURCE_FILE_EXTENSIONS.has(`.${entry.name.split(".").pop() ?? ""}`)) {
      files.push(entryPath);
    }
  }
}

async function addSupabaseSourceEvidence(projectDirectory: string, capability: CapabilityReport): Promise<void> {
  const files: string[] = [];

  for (const sourceDirectory of SOURCE_DIRECTORIES) {
    await collectSourceFiles(resolve(projectDirectory, sourceDirectory), files);
  }

  for (const sourceFile of files) {
    const status = await lstat(sourceFile).catch(() => undefined);

    if (status === undefined) {
      continue;
    }

    if (!status.isFile() || status.size > MAX_SOURCE_FILE_BYTES) {
      continue;
    }

    let contents: string;

    try {
      contents = await readFile(sourceFile, "utf8");
    } catch {
      continue;
    }

    if (contents.includes("@supabase/")) {
      capability.evidence.push({
        kind: "source-import",
        path: toRelativePath(projectDirectory, sourceFile),
        detail: "A Supabase package reference was found in a bounded source file",
      });
    }
  }
}

function addUnknowns(report: InspectionReport): void {
  const capabilityEntries: ReadonlyArray<readonly [string, CapabilityReport]> = [
    ["Next.js", report.capabilities.nextjs],
    ["React", report.capabilities.react],
    ["TypeScript", report.capabilities.typescript],
    ["Supabase", report.capabilities.supabase],
  ];

  for (const [capabilityName, capability] of capabilityEntries) {
    if (capability.evidence.length === 0) {
      capability.unknowns.push(`No ${capabilityName} evidence was found in the inspected paths.`);
    }
  }

  report.capabilities.nextjs.unknowns.push("No runtime or route behavior was executed or verified.");
  report.capabilities.react.unknowns.push("No rendered component behavior was executed or verified.");
  report.capabilities.typescript.unknowns.push("No TypeScript compilation was executed or verified.");
  report.capabilities.supabase.unknowns.push(
    "No Supabase project, credentials, session behavior, database schema, or Row Level Security policy was inspected.",
  );
}

export async function inspectProject(inputDirectory: string): Promise<InspectionReport> {
  const projectDirectory = resolve(inputDirectory);
  const report = createReport(projectDirectory);

  const targetStatus = await lstat(projectDirectory).catch(() => undefined);

  if (targetStatus === undefined) {
    report.errors.push("The target directory does not exist.");
    return report;
  }

  if (!targetStatus.isDirectory()) {
    report.errors.push("The target path is not a directory.");
    return report;
  }

  const packageManifestPath = resolve(projectDirectory, "package.json");
  let packageManifest: PackageManifest;

  try {
    const packageManifestText = await readFile(packageManifestPath, "utf8");
    const parsedManifest: unknown = JSON.parse(packageManifestText);

    if (!isRecord(parsedManifest)) {
      report.errors.push("package.json must contain an object.");
      return report;
    }

    packageManifest = parsedManifest;
  } catch (error) {
    if (isRecord(error) && error.code === "ENOENT") {
      report.errors.push("package.json is missing.");
    } else {
      const errorMessage = error instanceof Error ? error.message : "unknown error";
      report.errors.push(`Unable to parse package.json: ${errorMessage}`);
    }
    return report;
  }

  addDependencyEvidence(report.capabilities.nextjs, packageManifest, ["next"]);
  addDependencyEvidence(report.capabilities.react, packageManifest, ["react", "react-dom"]);
  addDependencyEvidence(report.capabilities.typescript, packageManifest, ["typescript"]);
  addDependencyEvidence(report.capabilities.supabase, packageManifest, ["@supabase/supabase-js", "@supabase/ssr"]);

  await addConfigurationEvidence(projectDirectory, report);
  await addSupabaseSourceEvidence(projectDirectory, report.capabilities.supabase);
  addUnknowns(report);

  return report;
}

export function usage(): string {
  return "Usage: feature inspect <project-directory>";
}

export function isInspectCommand(arguments_: readonly string[]): boolean {
  return arguments_.length === 2 && arguments_[0] === "inspect" && basename(arguments_[1]).length > 0;
}
