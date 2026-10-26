import { NextResponse } from "next/server";
import { startImport } from "../../../src/import-center/service";
import { isResponse, jsonError, requireAdmin, toErrorResponse } from "../../../src/server/http";
import { parseImportBody } from "../../../src/server/parse-request";

/** Creates the import and enqueues its first message. Processing happens in the worker, not here. */
export async function POST(request: Request) {
  try {
    // Authenticate before reading the body.
    const initial = await requireAdmin();
    if (isResponse(initial)) return initial;
    const body = parseImportBody(await request.json().catch(() => null));
    if (!body) return jsonError(400, "Invalid request.");
    const admin = body.tenantId ? await requireAdmin(body.tenantId) : initial;
    if (isResponse(admin)) return admin;

    const id = await startImport(admin.client, {
      tenantId: admin.tenantId,
      path: body.path,
      fileName: body.fileName,
      mapping: body.mapping,
      keyColumns: body.keyColumns,
    });
    return NextResponse.json({ id }, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
