#!/usr/bin/env node

import { inspectProject, isInspectCommand, usage } from "./inspect.js";

async function main(): Promise<void> {
  const arguments_ = process.argv.slice(2);

  if (!isInspectCommand(arguments_)) {
    process.stderr.write(`${usage()}\n`);
    process.exitCode = 1;
    return;
  }

  const report = await inspectProject(arguments_[1]);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown CLI failure";
  process.stderr.write(`feature inspect failed: ${message}\n`);
  process.exitCode = 1;
});
