import { getImport, listRowErrors } from "../../../../../src/import-center/service";
import { buildErrorCsv } from "../../../../../src/import-center/error-csv";
import { isResponse, jsonError, requireAdmin, toErrorResponse } from "../../../../../src/server/http";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Downloads the persisted row errors. RLS makes another tenant's import indistinguishable from a missing one. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!UUID.test(id)) return jsonError(404, "Import not found.");
    const admin = await requireAdmin();
    if (isResponse(admin)) return admin;

    const found = await getImport(admin.client, id);
    if (!found) return jsonError(404, "Import not found.");

    const csv = buildErrorCsv(await listRowErrors(admin.client, id));
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="import-${id}-errors.csv"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
