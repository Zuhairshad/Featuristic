import { NextResponse } from "next/server";
import { IMPORT_LIMITS } from "../../../../src/import-center/limits";
import { uploadCsv } from "../../../../src/import-center/service";
import { suggestPayloadKey } from "../../../../src/import-center/validation";
import { isResponse, jsonError, requireAdmin, toErrorResponse } from "../../../../src/server/http";
import { readUploadForm } from "../../../../src/server/limited-body";

export async function POST(request: Request) {
  try {
    // Authenticate before reading the body so anonymous callers cannot make us parse uploads.
    const initial = await requireAdmin();
    if (isResponse(initial)) return initial;

    // The cap is enforced on the stream itself, so a missing or forged Content-Length cannot make us
    // buffer more than the limit.
    const parsed = await readUploadForm(request);
    if (!parsed.ok) return jsonError(parsed.status, parsed.error);
    const form = parsed.value;
    const file = form.get("file");
    const requestedTenant = form.get("tenantId");
    const admin = typeof requestedTenant === "string" ? await requireAdmin(requestedTenant) : initial;
    if (isResponse(admin)) return admin;

    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".csv")) {
      return jsonError(400, "Choose a .csv file.");
    }
    if (file.size > IMPORT_LIMITS.maxFileBytes) return jsonError(413, "The file is larger than the 5 MB limit.");

    const upload = await uploadCsv(admin.client, admin.tenantId, new Uint8Array(await file.arrayBuffer()));
    return NextResponse.json(
      {
        path: upload.path,
        fileName: file.name,
        headers: upload.headers,
        totalRows: upload.totalRows,
        suggestedMapping: Object.fromEntries(upload.headers.map((header) => [header, suggestPayloadKey(header)])),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
