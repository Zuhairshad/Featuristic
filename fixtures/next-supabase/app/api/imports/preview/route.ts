import { NextResponse } from "next/server";
import { previewImport } from "../../../../src/import-center/service";
import { isResponse, jsonError, requireAdmin, toErrorResponse } from "../../../../src/server/http";
import { readJsonLimited } from "../../../../src/server/limited-body";
import { parseImportBody } from "../../../../src/server/parse-request";

export async function POST(request: Request) {
  try {
    // Authenticate before reading the body.
    const initial = await requireAdmin();
    if (isResponse(initial)) return initial;
    const raw = await readJsonLimited(request);
    if (!raw.ok) return jsonError(raw.status, raw.error);
    const body = parseImportBody(raw.value);
    if (!body) return jsonError(400, "Invalid request.");
    const admin = body.tenantId ? await requireAdmin(body.tenantId) : initial;
    if (isResponse(admin)) return admin;

    const preview = await previewImport(admin.client, {
      tenantId: admin.tenantId,
      path: body.path,
      mapping: body.mapping,
      keyColumns: body.keyColumns,
    });
    return NextResponse.json(preview, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
