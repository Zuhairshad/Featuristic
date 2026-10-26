import { NextResponse } from "next/server";
import { IMPORT_LIMITS } from "../../../../src/import-center/limits";
import { uploadCsv } from "../../../../src/import-center/service";
import { suggestPayloadKey } from "../../../../src/import-center/validation";
import { isResponse, jsonError, requireAdmin, toErrorResponse } from "../../../../src/server/http";
import {
  BodyTooLargeError,
  InvalidContentLengthError,
  parseFormData,
  readBodyWithLimit,
} from "../../../../src/server/limited-body";

/** File cap plus room for multipart framing. Enforced while streaming, before any multipart parsing. */
const MAX_BODY_BYTES = IMPORT_LIMITS.maxFileBytes + 64 * 1024;

export async function POST(request: Request) {
  try {
    // Authenticate before reading the body so anonymous callers cannot make us parse uploads.
    const initial = await requireAdmin();
    if (isResponse(initial)) return initial;

    let form: FormData;
    try {
      form = await parseFormData(request, await readBodyWithLimit(request, MAX_BODY_BYTES));
    } catch (error) {
      if (error instanceof BodyTooLargeError) return jsonError(413, "The file is larger than the 5 MB limit.");
      if (error instanceof InvalidContentLengthError || error instanceof TypeError) {
        return jsonError(400, "Invalid upload request.");
      }
      throw error;
    }
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
