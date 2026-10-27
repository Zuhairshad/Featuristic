import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { SAFE_SUMMARIES, type WorkerImport, type WorkerStore, processNextMessage } from "./worker";

const CSV = "Email,Name\r\na@example.test,Ann\r\nb@example.test,Bob\r\n";
const sha = (text: string) => createHash("sha256").update(text).digest("hex");

function record(overrides: Partial<WorkerImport> = {}): WorkerImport {
  return {
    id: "i1",
    status: "queued",
    run_id: 1,
    cursor: 0,
    total_rows: 2,
    batch_size: 100,
    header: ["Email", "Name"],
    mapping: { Email: "email", Name: "name" },
    key_columns: ["Email"],
    storage_path: "t/f.csv",
    file_sha256: sha(CSV),
    ...overrides,
  };
}

function fakeStore(options: { record?: WorkerImport; readCount?: number; ackFails?: boolean } = {}) {
  const calls: string[] = [];
  const store: WorkerStore = {
    readMessage: async () => ({
      msgId: 7,
      readCount: options.readCount ?? 1,
      payload: { import_id: "i1", run_id: 1, cursor: 0 },
    }),
    ack: async () => {
      calls.push("ack");
      if (options.ackFails) throw new Error("ack down");
    },
    archive: async () => void calls.push("archive"),
    getImport: async () => options.record ?? record(),
    downloadUpload: async () => new TextEncoder().encode(CSV),
    commitBatch: async () => {
      calls.push("commit");
      return "committed";
    },
    recordAttemptFailure: async () => void calls.push("recordAttemptFailure"),
    failImport: async () => void calls.push("failImport"),
  };
  return { store, calls };
}

const now = () => new Date("2026-01-01T00:00:00Z");

describe("processNextMessage recovery ordering", () => {
  it("records exhausted failure before archiving the message", async () => {
    const { store, calls } = fakeStore({ readCount: 4 });
    const outcome = await processNextMessage({ store, now });
    expect(outcome.kind).toBe("failed");
    expect(calls).toEqual(["failImport", "archive"]);
  });

  it("records a permanent failure before archiving the message", async () => {
    const { store, calls } = fakeStore({ record: record({ file_sha256: "0".repeat(64) }) });
    const outcome = await processNextMessage({ store, now });
    expect(outcome).toMatchObject({ kind: "failed", summary: SAFE_SUMMARIES.fileChanged });
    expect(calls).toEqual(["failImport", "archive"]);
  });
});

describe("processNextMessage mapping validation", () => {
  it("fails permanently, without committing, when the persisted mapping is invalid", async () => {
    const { store, calls } = fakeStore({ record: record({ key_columns: ["Missing"] }) });
    const outcome = await processNextMessage({ store, now });
    expect(outcome).toMatchObject({ kind: "failed", summary: SAFE_SUMMARIES.invalidMapping });
    expect(calls).toEqual(["failImport", "archive"]);
  });
});

describe("processNextMessage acknowledgement", () => {
  it("does not record a batch failure when only the acknowledgement fails after a commit", async () => {
    const { store, calls } = fakeStore({ ackFails: true });
    const outcome = await processNextMessage({ store, now });
    expect(outcome).toMatchObject({ kind: "committed", cursor: 2, done: true });
    expect(calls).toEqual(["commit", "ack"]);
  });
});
