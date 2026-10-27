import type { SupabaseClient } from "@supabase/supabase-js";
import { UPLOAD_BUCKET } from "./limits";
import type { CommitBatchArgs, QueueMessage, WorkerImport, WorkerStore } from "./worker";

/**
 * Worker store backed by a service-role Supabase client. The service-role key must only ever be
 * constructed on the server; it is never sent to or derived in the browser.
 */
export function createSupabaseWorkerStore(client: SupabaseClient): WorkerStore {
  function fail(operation: string, error: { code?: string } | null): never {
    // Only the operation name and SQLSTATE: the underlying message may contain row data.
    throw new Error(`${operation} failed${error?.code ? ` (${error.code})` : ""}`);
  }

  return {
    async readMessage(visibilityTimeoutSeconds): Promise<QueueMessage | null> {
      const { data, error } = await client.rpc("import_queue_read", { p_visibility_timeout: visibilityTimeoutSeconds });
      if (error) fail("import_queue_read", error);
      const row = (data as { msg_id: number; read_ct: number; message: unknown }[] | null)?.[0];
      return row ? { msgId: row.msg_id, readCount: row.read_ct, payload: row.message } : null;
    },

    async ack(msgId) {
      const { error } = await client.rpc("import_queue_ack", { p_msg_id: msgId });
      if (error) fail("import_queue_ack", error);
    },

    async archive(msgId) {
      const { error } = await client.rpc("import_queue_archive", { p_msg_id: msgId });
      if (error) fail("import_queue_archive", error);
    },

    async getImport(importId): Promise<WorkerImport | null> {
      const { data, error } = await client
        .from("imports")
        .select("id,status,run_id,cursor,total_rows,batch_size,header,mapping,key_columns,storage_path,file_sha256")
        .eq("id", importId)
        .maybeSingle();
      if (error) fail("load import", error);
      return (data as WorkerImport | null) ?? null;
    },

    async downloadUpload(path) {
      const { data, error } = await client.storage.from(UPLOAD_BUCKET).download(path);
      if (error || !data) throw new Error("download upload failed");
      return new Uint8Array(await data.arrayBuffer());
    },

    async commitBatch(args: CommitBatchArgs) {
      const { data, error } = await client.rpc("commit_import_batch", {
        p_import_id: args.importId,
        p_run_id: args.runId,
        p_cursor: args.cursor,
        p_next_cursor: args.nextCursor,
        p_records: args.records,
        p_errors: args.errors,
        p_now: args.now.toISOString(),
      });
      if (error) fail("commit_import_batch", error);
      return data === "committed" ? "committed" : "stale";
    },

    async recordAttemptFailure(importId, runId, summary) {
      const { error } = await client.rpc("record_import_attempt_failure", {
        p_import_id: importId,
        p_run_id: runId,
        p_summary: summary,
      });
      if (error) fail("record_import_attempt_failure", error);
    },

    async failImport(importId, runId, summary, now) {
      const { error } = await client.rpc("fail_import", {
        p_import_id: importId,
        p_run_id: runId,
        p_summary: summary,
        p_now: now.toISOString(),
      });
      if (error) fail("fail_import", error);
    },
  };
}
