import { createHash } from "node:crypto";
import { CsvFormatError, parseCsv } from "./csv";
import { type Mapping, validateMapping, validateRows } from "./validation";

/** Persisted import row, as far as the worker needs it. */
export type WorkerImport = {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  run_id: number;
  cursor: number;
  total_rows: number;
  batch_size: number;
  header: string[];
  mapping: Mapping;
  key_columns: string[];
  storage_path: string;
  file_sha256: string;
};

export type QueueMessage = {
  msgId: number;
  readCount: number;
  payload: unknown;
};

export type CommitBatchArgs = {
  importId: string;
  runId: number;
  cursor: number;
  nextCursor: number;
  records: { row_number: number; dedupe_key: string; payload: Record<string, string>; values: Record<string, string> }[];
  errors: { row_number: number; code: string; message: string; values: Record<string, string> }[];
  now: Date;
};

/** Persistence and storage seam. The Supabase implementation lives in worker-supabase.ts. */
export interface WorkerStore {
  readMessage(visibilityTimeoutSeconds: number): Promise<QueueMessage | null>;
  ack(msgId: number): Promise<void>;
  archive(msgId: number): Promise<void>;
  getImport(importId: string): Promise<WorkerImport | null>;
  downloadUpload(path: string): Promise<Uint8Array>;
  commitBatch(args: CommitBatchArgs): Promise<"committed" | "stale">;
  recordAttemptFailure(importId: string, runId: number, summary: string): Promise<void>;
  failImport(importId: string, runId: number, summary: string, now: Date): Promise<void>;
}

export type BatchContext = {
  importId: string;
  runId: number;
  cursor: number;
  nextCursor: number;
  messageId: number;
};

/** Failure-injection seam for tests. Throw SimulatedCrash to model a crash, any other error for a handled failure. */
export type WorkerHooks = {
  /** After the batch is validated, before its transaction commits. */
  beforeCommit?: (context: BatchContext) => void | Promise<void>;
  /** After the batch committed, before the queue message is acknowledged. */
  afterCommit?: (context: BatchContext) => void | Promise<void>;
};

export type WorkerOptions = {
  store: WorkerStore;
  now: () => Date;
  /** Reads allowed per message before the import is failed and the message archived. */
  maxAttempts?: number;
  visibilityTimeoutSeconds?: number;
  hooks?: WorkerHooks;
};

export type WorkOutcome =
  | { kind: "idle" }
  | { kind: "stale"; importId?: string }
  | { kind: "committed"; importId: string; cursor: number; done: boolean }
  | { kind: "retry"; importId: string; summary: string }
  | { kind: "failed"; importId: string; summary: string };

export const SAFE_SUMMARIES = {
  transient: "A processing step failed and will be retried automatically.",
  storage: "The uploaded file could not be read from storage; retrying automatically.",
  exhausted: "Processing stopped after repeated failures. Replay the import to resume from the last saved row.",
  fileChanged: "The uploaded file no longer matches the file that was validated. Start a new import.",
  invalidMapping: "The saved column mapping is not valid. Start a new import.",
} as const;

/**
 * Thrown by test hooks to model a process dying mid-batch. The worker deliberately does not handle
 * it (a dead process records nothing), so the queue message is left for redelivery.
 */
export class SimulatedCrash extends Error {}

class PermanentImportError extends Error {
  constructor(readonly summary: string) {
    super(summary);
  }
}

class StorageReadError extends Error {}

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_VISIBILITY_TIMEOUT_SECONDS = 30;

function parsePayload(payload: unknown): { importId: string; runId: number; cursor: number } | null {
  if (typeof payload !== "object" || payload === null) return null;
  const { import_id, run_id, cursor } = payload as Record<string, unknown>;
  if (typeof import_id !== "string" || !Number.isInteger(run_id) || !Number.isInteger(cursor)) return null;
  return { importId: import_id, runId: run_id as number, cursor: cursor as number };
}

/**
 * Claims one queue message and processes at most one bounded batch.
 *
 * Delivery is at-least-once. Safety comes from the database commit, which only applies when the
 * message's run id and cursor still match the import ("stale" otherwise), so redelivered or
 * superseded messages are acknowledged without effect. A crash before the commit leaves the message
 * to reappear after its visibility timeout; a crash after the commit but before the ack leaves a
 * stale message that is acknowledged on its next delivery.
 */
export async function processNextMessage(options: WorkerOptions): Promise<WorkOutcome> {
  const { store, now, hooks } = options;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const message = await store.readMessage(options.visibilityTimeoutSeconds ?? DEFAULT_VISIBILITY_TIMEOUT_SECONDS);
  if (!message) return { kind: "idle" };

  const payload = parsePayload(message.payload);
  if (!payload) {
    await store.archive(message.msgId);
    return { kind: "stale" };
  }

  if (message.readCount > maxAttempts) {
    // Record the failure first: a crash between the two steps then leaves a redeliverable message that
    // the run/cursor guard turns into a no-op, instead of a stale import with no message (ADR 0004).
    await store.failImport(payload.importId, payload.runId, SAFE_SUMMARIES.exhausted, now());
    await store.archive(message.msgId);
    return { kind: "failed", importId: payload.importId, summary: SAFE_SUMMARIES.exhausted };
  }

  const record = await store.getImport(payload.importId);
  if (
    !record ||
    (record.status !== "queued" && record.status !== "running") ||
    record.run_id !== payload.runId ||
    record.cursor !== payload.cursor
  ) {
    await store.ack(message.msgId);
    return { kind: "stale", importId: payload.importId };
  }

  let committedOutcome: WorkOutcome;
  try {
    const mappingProblems = validateMapping(record.header, record.mapping, record.key_columns);
    if (mappingProblems.length > 0) throw new PermanentImportError(SAFE_SUMMARIES.invalidMapping);

    const nextCursor = Math.min(record.cursor + record.batch_size, record.total_rows);
    const bytes = await readUpload(store, record);
    const parsed = parseUpload(bytes, record);
    const { valid, invalid } = validateRows(
      parsed.headers,
      parsed.rows,
      record.mapping,
      record.key_columns,
      record.cursor,
      nextCursor,
    );

    const context: BatchContext = {
      importId: record.id,
      runId: record.run_id,
      cursor: record.cursor,
      nextCursor,
      messageId: message.msgId,
    };
    await hooks?.beforeCommit?.(context);

    const result = await store.commitBatch({
      importId: record.id,
      runId: record.run_id,
      cursor: record.cursor,
      nextCursor,
      records: valid.map((row) => ({
        row_number: row.rowNumber,
        dedupe_key: row.dedupeKey,
        payload: row.payload,
        values: row.values,
      })),
      errors: invalid.map((row) => ({
        row_number: row.rowNumber,
        code: row.code,
        message: row.message,
        values: row.values,
      })),
      now: now(),
    });

    if (result === "committed") await hooks?.afterCommit?.(context);

    committedOutcome =
      result === "committed"
        ? { kind: "committed", importId: record.id, cursor: nextCursor, done: nextCursor >= record.total_rows }
        : { kind: "stale", importId: record.id };
  } catch (error) {
    if (error instanceof SimulatedCrash) throw error;
    if (error instanceof PermanentImportError || error instanceof CsvFormatError) {
      const summary = error instanceof PermanentImportError ? error.summary : error.message;
      await store.failImport(record.id, record.run_id, summary, now());
      await store.archive(message.msgId);
      return { kind: "failed", importId: record.id, summary };
    }
    // Retryable. Only a fixed, sanitized summary is persisted; raw error text may contain row data.
    const summary = error instanceof StorageReadError ? SAFE_SUMMARIES.storage : SAFE_SUMMARIES.transient;
    await store.recordAttemptFailure(record.id, record.run_id, summary);
    return { kind: "retry", importId: record.id, summary };
  }

  // The batch is already committed (or was stale). A failed acknowledgement is not a batch failure: the
  // message is redelivered after its visibility timeout and discarded as stale, so nothing is recorded.
  try {
    await store.ack(message.msgId);
  } catch {
    // Intentionally ignored; see above.
  }
  return committedOutcome;
}

/** Processes up to `maxMessages` messages, stopping early when the queue is idle. Always bounded. */
export async function runWorker(options: WorkerOptions, maxMessages: number): Promise<WorkOutcome[]> {
  const outcomes: WorkOutcome[] = [];
  for (let processed = 0; processed < maxMessages; processed++) {
    const outcome = await processNextMessage(options);
    outcomes.push(outcome);
    if (outcome.kind === "idle") break;
  }
  return outcomes;
}

async function readUpload(store: WorkerStore, record: WorkerImport): Promise<Uint8Array> {
  let bytes: Uint8Array;
  try {
    bytes = await store.downloadUpload(record.storage_path);
  } catch {
    throw new StorageReadError();
  }
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== record.file_sha256) {
    throw new PermanentImportError(SAFE_SUMMARIES.fileChanged);
  }
  return bytes;
}

function parseUpload(bytes: Uint8Array, record: WorkerImport) {
  const parsed = parseCsv(new TextDecoder("utf-8").decode(bytes));
  const sameHeader =
    parsed.headers.length === record.header.length && parsed.headers.every((header, i) => header === record.header[i]);
  if (!sameHeader || parsed.rows.length !== record.total_rows) {
    throw new PermanentImportError(SAFE_SUMMARIES.fileChanged);
  }
  return parsed;
}
