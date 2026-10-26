import { randomUUID } from "node:crypto";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import { Client as PgClient } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildErrorCsv } from "../../src/import-center/error-csv";
import { UPLOAD_BUCKET } from "../../src/import-center/limits";
import {
  type ImportSummary,
  getImport,
  listImports,
  listRowErrors,
  previewImport,
  replayImport,
  startImport,
  uploadCsv,
} from "../../src/import-center/service";
import {
  SAFE_SUMMARIES,
  SimulatedCrash,
  type WorkerHooks,
  type WorkerOptions,
  processNextMessage,
  runWorker,
} from "../../src/import-center/worker";
import { createSupabaseWorkerStore } from "../../src/import-center/worker-supabase";

// Fixed identities from supabase/seed.sql (local only).
const TENANT_A = "aaaaaaaa-0000-4000-8000-000000000001";
const TENANT_B = "bbbbbbbb-0000-4000-8000-000000000002";
const PASSWORD = "local-dev-password";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Run through: pnpm test:integration (needs a local Supabase stack).`);
  return value;
}

const API_URL = requireEnv("LOCAL_SUPABASE_API_URL");
const DB_URL = requireEnv("LOCAL_SUPABASE_DB_URL");
const PUBLISHABLE_KEY = requireEnv("LOCAL_SUPABASE_PUBLISHABLE_KEY");
const SERVICE_ROLE_KEY = requireEnv("LOCAL_SUPABASE_SERVICE_ROLE_KEY");

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(API_URL, SERVICE_ROLE_KEY, clientOptions);
const anon = createClient(API_URL, PUBLISHABLE_KEY, clientOptions);
const pg = new PgClient({ connectionString: DB_URL });

async function signIn(email: string): Promise<SupabaseClient> {
  const client = createClient(API_URL, PUBLISHABLE_KEY, clientOptions);
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`sign-in failed for ${email}`);
  return client;
}

let adminA: SupabaseClient;
let memberA: SupabaseClient;
let adminB: SupabaseClient;

const encoder = new TextEncoder();
const createdImports: string[] = [];
const createdPaths: string[] = [];

/** Unique key prefix per test so tenant-wide duplicate keys never collide across tests. */
let tag = "";

function csv(rows: string[][], header = ["Email", "Name"]): Uint8Array<ArrayBuffer> {
  return encoder.encode(`${[header, ...rows].map((row) => row.join(",")).join("\n")}\n`);
}

function makeRows(count: number, offset = 0): string[][] {
  return Array.from({ length: count }, (_, i) => [`${tag}-${offset + i}@example.test`, `Person ${offset + i}`]);
}

const mapping = { Email: "email", Name: "name" };

async function createImport(client: SupabaseClient, bytes: Uint8Array, tenantId = TENANT_A): Promise<string> {
  const upload = await uploadCsv(client, tenantId, bytes);
  createdPaths.push(upload.path);
  const id = await startImport(client, {
    tenantId,
    path: upload.path,
    fileName: "people.csv",
    mapping,
    keyColumns: ["Email"],
  });
  createdImports.push(id);
  return id;
}

function workerOptions(hooks?: WorkerHooks, overrides: Partial<WorkerOptions> = {}): WorkerOptions {
  return {
    store: createSupabaseWorkerStore(service),
    now: () => new Date(),
    visibilityTimeoutSeconds: 0, // redeliver immediately so retries are deterministic in tests
    maxAttempts: 3,
    hooks,
    ...overrides,
  };
}

async function queueCounts(): Promise<{ queued: number; archived: number }> {
  const queued = await pg.query("select count(*)::int as n from pgmq.q_import_center_jobs");
  const archived = await pg.query("select count(*)::int as n from pgmq.a_import_center_jobs");
  return { queued: queued.rows[0].n, archived: archived.rows[0].n };
}

async function summary(client: SupabaseClient, id: string): Promise<ImportSummary> {
  const row = await getImport(client, id);
  if (!row) throw new Error("import not visible");
  return row;
}

async function recordCount(importId: string): Promise<number> {
  const { count } = await service.from("import_records").select("id", { count: "exact", head: true }).eq("import_id", importId);
  return count ?? 0;
}

beforeAll(async () => {
  await pg.connect();
  [adminA, memberA, adminB] = await Promise.all([
    signIn("admin-a@example.test"),
    signIn("member-a@example.test"),
    signIn("admin-b@example.test"),
  ]);
});

beforeEach(async () => {
  tag = randomUUID().slice(0, 8);
  // The queue is global; start each test from an empty one so the worker only sees this test's work.
  await pg.query("select pgmq.purge_queue('import_center_jobs')");
  await pg.query("truncate pgmq.a_import_center_jobs");
});

afterAll(async () => {
  if (createdImports.length > 0) await service.from("imports").delete().in("id", createdImports);
  if (createdPaths.length > 0) await service.storage.from(UPLOAD_BUCKET).remove(createdPaths);
  await pg.query("select pgmq.purge_queue('import_center_jobs')");
  await pg.end();
});

describe("valid import with progress, bounded batches, and error file", () => {
  it("processes 250 rows in three durable batches, persisting progress after each", async () => {
    const rows = [
      ...makeRows(247),
      ["", "No Email"], // row 248: missing key
      [`${tag}-5@example.test`.toUpperCase(), "Dup of row 6"], // row 249: duplicate_in_file (case-insensitive)
      ["only-one-column"], // row 250: column count mismatch
    ];
    const id = await createImport(adminA, csv(rows));

    expect(await summary(adminA, id)).toMatchObject({ status: "queued", cursor: 0, total_rows: 250 });

    const options = workerOptions();
    const progress: number[] = [];
    for (let batch = 0; batch < 3; batch++) {
      const outcome = await processNextMessage(options);
      expect(outcome.kind).toBe("committed");
      progress.push((await summary(adminA, id)).cursor);
    }
    expect(progress).toEqual([100, 200, 250]);

    const finished = await summary(adminA, id);
    expect(finished).toMatchObject({
      status: "completed",
      imported_count: 247,
      duplicate_count: 1,
      invalid_count: 2,
      error_summary: null,
    });
    expect(finished.imported_count + finished.duplicate_count + finished.invalid_count).toBe(finished.cursor);
    expect(await recordCount(id)).toBe(247);
    expect((await processNextMessage(options)).kind).toBe("idle");

    const errors = await listRowErrors(adminA, id);
    expect(errors.map((e) => [e.row_number, e.code])).toEqual([
      [248, "missing_key"],
      [249, "duplicate_in_file"],
      [250, "column_count_mismatch"],
    ]);
    const errorCsv = buildErrorCsv(errors);
    expect(errorCsv.split("\r\n")[0]).toBe("row_number,error_code,error_message,row_values");
    expect(errorCsv).toContain("duplicate_in_file");
  });

  it("previews failures without writing anything", async () => {
    const upload = await uploadCsv(adminA, TENANT_A, csv([...makeRows(3), ["", "Blank"], [`${tag}-0@example.test`, "Again"]]));
    createdPaths.push(upload.path);
    const preview = await previewImport(adminA, { tenantId: TENANT_A, path: upload.path, mapping, keyColumns: ["Email"] });
    expect(preview).toMatchObject({ totalRows: 5, importableRows: 3, invalidRows: 1, duplicateInFileRows: 1 });
    const { count } = await service.from("import_records").select("id", { count: "exact", head: true }).like("dedupe_key", `%${tag}%`);
    expect(count).toBe(0);
  });
});

describe("invalid input", () => {
  it("rejects bad headers and malformed files before storing anything", async () => {
    await expect(uploadCsv(adminA, TENANT_A, encoder.encode("a,,c\n1,2,3\n"))).rejects.toMatchObject({ code: "empty_header" });
    await expect(uploadCsv(adminA, TENANT_A, encoder.encode("a,A\n1,2\n"))).rejects.toMatchObject({ code: "duplicate_header" });
    await expect(uploadCsv(adminA, TENANT_A, encoder.encode('a,b\n"x,1\n'))).rejects.toMatchObject({ code: "malformed_csv" });
    await expect(uploadCsv(adminA, TENANT_A, encoder.encode("a,b\n"))).rejects.toMatchObject({ code: "no_data_rows" });
  });

  it("rejects an invalid mapping or unmapped key column when starting", async () => {
    const upload = await uploadCsv(adminA, TENANT_A, csv(makeRows(2)));
    createdPaths.push(upload.path);
    await expect(
      startImport(adminA, { tenantId: TENANT_A, path: upload.path, fileName: "x.csv", mapping, keyColumns: ["Nope"] }),
    ).rejects.toMatchObject({ code: "invalid_mapping" });
  });
});

describe("duplicate policy across imports", () => {
  it("skips rows whose normalized key exists from a completed import and never overwrites them", async () => {
    const first = await createImport(adminA, csv([[`${tag}-x@example.test`, "Original Name"], ...makeRows(2)]));
    await runWorker(workerOptions(), 5);
    expect((await summary(adminA, first)).status).toBe("completed");

    const upload = await uploadCsv(adminA, TENANT_A, csv([[`  ${tag}-X@Example.TEST `, "Changed Name"], ...makeRows(1, 50)]));
    createdPaths.push(upload.path);
    const preview = await previewImport(adminA, { tenantId: TENANT_A, path: upload.path, mapping, keyColumns: ["Email"] });
    expect(preview).toMatchObject({ duplicateExistingRows: 1, importableRows: 1 });

    const second = await startImport(adminA, { tenantId: TENANT_A, path: upload.path, fileName: "again.csv", mapping, keyColumns: ["Email"] });
    createdImports.push(second);
    await runWorker(workerOptions(), 5);

    expect(await summary(adminA, second)).toMatchObject({ status: "completed", imported_count: 1, duplicate_count: 1 });
    const errors = await listRowErrors(adminA, second);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ row_number: 1, code: "duplicate_existing" });

    const stored = await service.from("import_records").select("payload").like("dedupe_key", `%${tag}-x@example.test%`);
    expect(stored.data).toEqual([{ payload: { email: `${tag}-x@example.test`, name: "Original Name" } }]);
  });
});

describe("interruption, retry, and resume", () => {
  it("recovers from a crash before commit and a crash after commit without duplicating records", async () => {
    const id = await createImport(adminA, csv(makeRows(250)));

    // Batch 1 commits normally.
    expect((await processNextMessage(workerOptions())).kind).toBe("committed");
    expect((await summary(adminA, id)).cursor).toBe(100);

    // Crash after validating batch 2 but before its transaction commits: nothing is persisted.
    await expect(
      processNextMessage(
        workerOptions({
          beforeCommit: () => {
            throw new SimulatedCrash();
          },
        }),
      ),
    ).rejects.toBeInstanceOf(SimulatedCrash);
    expect(await summary(adminA, id)).toMatchObject({ cursor: 100, imported_count: 100, status: "running" });
    expect(await recordCount(id)).toBe(100);

    // Redelivery: batch 2 commits, then the process dies before acknowledging the message.
    await expect(
      processNextMessage(
        workerOptions({
          afterCommit: () => {
            throw new SimulatedCrash();
          },
        }),
      ),
    ).rejects.toBeInstanceOf(SimulatedCrash);
    expect(await summary(adminA, id)).toMatchObject({ cursor: 200, imported_count: 200 });

    // The unacknowledged message is now stale (its cursor was already committed) and is discarded.
    const outcomes = await runWorker(workerOptions(), 10);
    expect(outcomes.map((o) => o.kind)).toEqual(["stale", "committed", "idle"]);

    expect(await summary(adminA, id)).toMatchObject({ status: "completed", cursor: 250, imported_count: 250, duplicate_count: 0 });
    expect(await recordCount(id)).toBe(250);
    expect((await queueCounts()).queued).toBe(0);
  });

  it("records a retryable failure with a sanitized summary, then succeeds on redelivery", async () => {
    const id = await createImport(adminA, csv(makeRows(5)));
    const outcome = await processNextMessage(
      workerOptions({
        beforeCommit: () => {
          throw new Error("boom: row data jane@example.test and password=hunter2");
        },
      }),
    );
    expect(outcome).toMatchObject({ kind: "retry", summary: SAFE_SUMMARIES.transient });
    const failing = await summary(adminA, id);
    expect(failing.error_summary).toBe(SAFE_SUMMARIES.transient);
    expect(failing.error_summary).not.toMatch(/hunter2|jane@/);

    expect((await processNextMessage(workerOptions())).kind).toBe("committed");
    expect(await summary(adminA, id)).toMatchObject({ status: "completed", error_summary: null, imported_count: 5 });
  });

  it("fails after exhausting retries, archives the message, and replay resumes from the last committed row", async () => {
    const id = await createImport(adminA, csv(makeRows(250)));
    expect((await processNextMessage(workerOptions())).kind).toBe("committed"); // rows 1-100 committed

    const before = await service.from("import_records").select("id,row_number").eq("import_id", id).order("row_number");
    expect(before.data).toHaveLength(100);

    // Every further attempt fails. maxAttempts=3 -> three retries, then the fourth read exhausts.
    const alwaysFail: WorkerHooks = {
      beforeCommit: () => {
        throw new Error("still broken");
      },
    };
    const outcomes = await runWorker(workerOptions(alwaysFail), 6);
    expect(outcomes.map((o) => o.kind)).toEqual(["retry", "retry", "retry", "failed", "idle"]);

    expect(await summary(adminA, id)).toMatchObject({ status: "failed", cursor: 100, error_summary: SAFE_SUMMARIES.exhausted });
    expect(await queueCounts()).toEqual({ queued: 0, archived: 1 });

    // A failed import cannot make progress on its own, and nothing is lost.
    expect((await processNextMessage(workerOptions())).kind).toBe("idle");

    // Another tenant cannot replay it; the owning admin can.
    await expect(replayImport(adminB, id)).rejects.toMatchObject({ code: "not_found" });
    await replayImport(adminA, id);
    expect(await summary(adminA, id)).toMatchObject({ status: "queued", run_id: 2, cursor: 100 });

    await runWorker(workerOptions(), 10);
    expect(await summary(adminA, id)).toMatchObject({ status: "completed", cursor: 250, imported_count: 250, duplicate_count: 0 });

    // The first 100 records are the same rows (not re-inserted), and the total has no duplicates.
    const after = await service.from("import_records").select("id,row_number").eq("import_id", id).order("row_number");
    expect(after.data).toHaveLength(250);
    expect(after.data?.slice(0, 100)).toEqual(before.data);
    expect(new Set(after.data?.map((r) => r.row_number)).size).toBe(250);
  });

  it("never replays a completed import in place", async () => {
    const id = await createImport(adminA, csv(makeRows(3)));
    await runWorker(workerOptions(), 3);
    await expect(replayImport(adminA, id)).rejects.toMatchObject({ code: "replay_failed" });
    expect(await summary(adminA, id)).toMatchObject({ status: "completed", run_id: 1 });
  });

  it("fails permanently when the stored file no longer matches the validated checksum", async () => {
    const bytes = csv(makeRows(3));
    const upload = await uploadCsv(adminA, TENANT_A, bytes);
    createdPaths.push(upload.path);
    const id = await startImport(adminA, { tenantId: TENANT_A, path: upload.path, fileName: "t.csv", mapping, keyColumns: ["Email"] });
    createdImports.push(id);

    // Only a privileged actor can alter the object; the tenant admin has no update path (see database tests).
    const tampered = await service.storage
      .from(UPLOAD_BUCKET)
      .upload(upload.path, new Blob([csv(makeRows(3, 100))], { type: "text/csv" }), { contentType: "text/csv", upsert: true });
    expect(tampered.error).toBeNull();

    const outcome = await processNextMessage(workerOptions());
    expect(outcome).toMatchObject({ kind: "failed", summary: SAFE_SUMMARIES.fileChanged });
    expect(await recordCount(id)).toBe(0);
    expect(await queueCounts()).toEqual({ queued: 0, archived: 1 });
  });
});

describe("tenant and role isolation", () => {
  it("hides another tenant's imports, errors, records, and uploads and blocks replay", async () => {
    const id = await createImport(adminA, csv([...makeRows(3), ["", "Blank"]]));
    await runWorker(workerOptions(), 3);
    expect((await summary(adminA, id)).invalid_count).toBe(1);

    for (const outsider of [adminB, memberA, anon]) {
      expect(await getImport(outsider, id)).toBeNull();
      expect((await outsider.from("import_row_errors").select("id").eq("import_id", id)).data ?? []).toEqual([]);
      expect((await outsider.from("import_records").select("id").eq("import_id", id)).data ?? []).toEqual([]);
    }
    expect(await listImports(adminB).then((rows) => rows.some((row) => row.id === id))).toBe(false);
    await expect(listImports(anon)).rejects.toMatchObject({ code: "not_authorized" });

    const { data: upload } = await service.from("imports").select("storage_path").eq("id", id).single();
    for (const outsider of [adminB, memberA, anon]) {
      const { data, error } = await outsider.storage.from(UPLOAD_BUCKET).download(upload?.storage_path as string);
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    }

    await expect(replayImport(adminB, id)).rejects.toMatchObject({ code: "not_found" });
    await expect(replayImport(memberA, id)).rejects.toMatchObject({ code: "not_found" });
    await expect(replayImport(anon, id)).rejects.toMatchObject({ code: "replay_failed" });
  });

  it("blocks non-admins and cross-tenant admins from uploading, previewing, and starting", async () => {
    await expect(uploadCsv(memberA, TENANT_A, csv(makeRows(1)))).rejects.toMatchObject({ code: "upload_failed" });
    await expect(uploadCsv(adminB, TENANT_A, csv(makeRows(1)))).rejects.toMatchObject({ code: "upload_failed" });
    await expect(uploadCsv(anon, TENANT_A, csv(makeRows(1)))).rejects.toMatchObject({ code: "upload_failed" });

    const upload = await uploadCsv(adminA, TENANT_A, csv(makeRows(2)));
    createdPaths.push(upload.path);
    const request = { tenantId: TENANT_A, path: upload.path, fileName: "x.csv", mapping, keyColumns: ["Email"] };
    await expect(startImport(adminB, request)).rejects.toMatchObject({ code: "upload_not_found" });
    await expect(startImport(memberA, request)).rejects.toMatchObject({ code: "upload_not_found" });
    // Even if tenant B names tenant A's path in its own tenant, the path/tenant binding is enforced.
    await expect(startImport(adminB, { ...request, tenantId: TENANT_B })).rejects.toMatchObject({ code: "upload_not_found" });
  });

  it("does not let a session call worker functions or read the queue", async () => {
    for (const client of [adminA, adminB, memberA, anon]) {
      const read = await client.rpc("import_queue_read", { p_visibility_timeout: 1 });
      expect(read.error).not.toBeNull();
      const commit = await client.rpc("commit_import_batch", {
        p_import_id: randomUUID(),
        p_run_id: 1,
        p_cursor: 0,
        p_next_cursor: 1,
        p_records: [],
        p_errors: [],
        p_now: new Date().toISOString(),
      });
      expect(commit.error).not.toBeNull();
    }
  });
});
