import type { Mapping } from "../import-center/validation";

export type ImportBody = {
  tenantId: string | null;
  path: string;
  fileName: string;
  mapping: Mapping;
  keyColumns: string[];
};

/** Narrow, defensive parse of the JSON bodies for preview and start. Returns null if malformed. */
export function parseImportBody(body: unknown): ImportBody | null {
  if (typeof body !== "object" || body === null) return null;
  const { tenantId, path, fileName, mapping, keyColumns } = body as Record<string, unknown>;
  if (typeof path !== "string" || path.length > 300) return null;
  if (typeof mapping !== "object" || mapping === null || Array.isArray(mapping)) return null;
  if (!Object.values(mapping).every((value) => typeof value === "string")) return null;
  if (!Array.isArray(keyColumns) || !keyColumns.every((column) => typeof column === "string")) return null;
  return {
    tenantId: typeof tenantId === "string" ? tenantId : null,
    path,
    fileName: typeof fileName === "string" ? fileName : "upload.csv",
    mapping: mapping as Mapping,
    keyColumns,
  };
}
