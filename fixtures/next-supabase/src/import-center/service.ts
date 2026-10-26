import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CsvFormatError, type ParsedCsv, parseCsv } from "./csv";
import { IMPORT_LIMITS, UPLOAD_BUCKET } from "./limits";
import { type Mapping, type PreviewResult, previewRows, validateMapping, validateRows } from "./validation";

/**
 * Operations performed on behalf of a signed-in user. They take a session-bound Supabase client, so
 * every read and write is evaluated by RLS and the SECURITY DEFINER functions as that user.
 * None of them accepts a role or tenant claim as proof of authority.
 */

export type ImportServiceErrorCode =
  | "upload_failed"
  | "upload_not_found"
  | "invalid_mapping"
  | "not_authorized"
  | "start_failed"
  | "replay_failed"
  | "not_found";

export class ImportServiceError extends Error {
  constructor(
    readonly code: ImportServiceErrorCode,
    message: string,
    readonly problems: string[] = [],
  ) {
    super(message);
    this.name = "ImportServiceError";
  }
}

export type ImportSummary = {
  id: string;
  file_name: string;
  status: "queued" | "running" | "completed" | "failed";
  total_rows: number;
  cursor: number;
  imported_count: number;
  duplicate_count: number;
  invalid_count: number;
  error_summary: string | null;
  run_id: number;
  created_at: string;
  completed_at: string | null;
};

export const IMPORT_SUMMARY_COLUMNS =
  "id,file_name,status,total_rows,cursor,imported_count,duplicate_count,invalid_count,error_summary,run_id,created_at,completed_at";

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function decode(bytes: Uint8Array): string {
  return new TextDecoder("utf-8").decode(bytes);
}

/** Validates the file shape, then stores it in the private bucket under the tenant's folder. */
export async function uploadCsv(
  client: SupabaseClient,
  tenantId: string,
  bytes: Uint8Array,
): Promise<{ path: string; sha256: string; headers: string[]; totalRows: number }> {
  if (bytes.byteLength > IMPORT_LIMITS.maxFileBytes) {
    throw new CsvFormatError("file_too_large", "The file is larger than the 5 MB limit.");
  }
  const parsed = parseCsv(decode(bytes));
  const path = `${tenantId}/${randomUUID()}.csv`;
  const { error } = await client.storage
    .from(UPLOAD_BUCKET)
    .upload(path, new Blob([bytes as BlobPart], { type: "text/csv" }), { contentType: "text/csv", upsert: false });
  if (error) {
    throw new ImportServiceError("upload_failed", "The file could not be uploaded. You may not have permission.");
  }
  return { path, sha256: sha256Hex(bytes), headers: parsed.headers, totalRows: parsed.rows.length };
}

export async function loadUpload(
  client: SupabaseClient,
  path: string,
): Promise<{ parsed: ParsedCsv; sha256: string }> {
  const { data, error } = await client.storage.from(UPLOAD_BUCKET).download(path);
  if (error || !data) {
    throw new ImportServiceError("upload_not_found", "The uploaded file was not found.");
  }
  const bytes = new Uint8Array(await data.arrayBuffer());
  return { parsed: parseCsv(decode(bytes)), sha256: sha256Hex(bytes) };
}

/** Normalized keys that already exist for the tenant. RLS makes this empty for non-admins. */
export async function findExistingKeys(client: SupabaseClient, tenantId: string, keys: string[]): Promise<Set<string>> {
  const found = new Set<string>();
  const chunkSize = 1000;
  for (let offset = 0; offset < keys.length; offset += chunkSize) {
    const { data, error } = await client.rpc("existing_dedupe_keys", {
      p_tenant_id: tenantId,
      p_keys: keys.slice(offset, offset + chunkSize),
    });
    if (error) throw new ImportServiceError("not_authorized", "Existing records could not be checked.");
    for (const key of (data as string[] | null) ?? []) found.add(key);
  }
  return found;
}

export type PreviewRequest = { tenantId: string; path: string; mapping: Mapping; keyColumns: string[] };

/** Dry run: nothing is written. Mirrors what the worker will do for each row. */
export async function previewImport(client: SupabaseClient, request: PreviewRequest): Promise<PreviewResult> {
  const { parsed } = await loadUpload(client, request.path);
  const problems = validateMapping(parsed.headers, request.mapping, request.keyColumns);
  if (problems.length > 0) throw new ImportServiceError("invalid_mapping", "The column mapping is not valid.", problems);

  const { valid } = validateRows(parsed.headers, parsed.rows, request.mapping, request.keyColumns);
  const existing = await findExistingKeys(client, request.tenantId, [...new Set(valid.map((row) => row.dedupeKey))]);
  return previewRows(parsed.headers, parsed.rows, request.mapping, request.keyColumns, existing);
}

export type StartRequest = PreviewRequest & { fileName: string };

/** Re-validates from the stored file (the preview is never trusted) and enqueues the import. */
export async function startImport(client: SupabaseClient, request: StartRequest): Promise<string> {
  const { parsed, sha256 } = await loadUpload(client, request.path);
  const problems = validateMapping(parsed.headers, request.mapping, request.keyColumns);
  if (problems.length > 0) throw new ImportServiceError("invalid_mapping", "The column mapping is not valid.", problems);

  const { data, error } = await client.rpc("start_import", {
    p_tenant_id: request.tenantId,
    p_file_name: request.fileName.slice(0, 255) || "upload.csv",
    p_storage_path: request.path,
    p_file_sha256: sha256,
    p_header: parsed.headers,
    p_mapping: request.mapping,
    p_key_columns: request.keyColumns,
    p_total_rows: parsed.rows.length,
    p_batch_size: IMPORT_LIMITS.batchSize,
  });
  if (error) {
    throw new ImportServiceError(
      error.code === "42501" ? "not_authorized" : "start_failed",
      error.code === "42501" ? "Only a tenant admin can start an import." : "The import could not be started.",
    );
  }
  return data as string;
}

export async function replayImport(client: SupabaseClient, importId: string): Promise<void> {
  const { error } = await client.rpc("replay_import", { p_import_id: importId });
  if (!error) return;
  if (error.code === "P0002") throw new ImportServiceError("not_found", "Import not found.");
  throw new ImportServiceError("replay_failed", "This import cannot be replayed right now.");
}

export async function listImports(client: SupabaseClient, limit = 50): Promise<ImportSummary[]> {
  const { data, error } = await client
    .from("imports")
    .select(IMPORT_SUMMARY_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new ImportServiceError("not_authorized", "Imports could not be loaded.");
  return (data ?? []) as ImportSummary[];
}

/** RLS returns no row for another tenant's import, indistinguishable from a missing one. */
export async function getImport(client: SupabaseClient, importId: string): Promise<ImportSummary | null> {
  const { data, error } = await client.from("imports").select(IMPORT_SUMMARY_COLUMNS).eq("id", importId).maybeSingle();
  if (error) return null;
  return (data as ImportSummary | null) ?? null;
}

/** Every persisted row error for an import, paged past the API row cap. Bounded by maxRows. */
export async function listRowErrors(client: SupabaseClient, importId: string) {
  const pageSize = 1000;
  const rows: { row_number: number; code: string; message: string; row_values: Record<string, string> }[] = [];
  for (let offset = 0; offset < IMPORT_LIMITS.maxRows; offset += pageSize) {
    const { data, error } = await client
      .from("import_row_errors")
      .select("row_number,code,message,row_values")
      .eq("import_id", importId)
      .order("row_number", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw new ImportServiceError("not_authorized", "Row errors could not be loaded.");
    rows.push(...((data ?? []) as typeof rows));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}
