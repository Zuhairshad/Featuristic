import { NextResponse } from "next/server";
import { CsvFormatError } from "../import-center/csv";
import { ImportServiceError } from "../import-center/service";
import { ConfigurationError } from "./env";
import { type AdminContext, getSessionState } from "./session";

export function jsonError(status: number, error: string, problems?: string[]) {
  return NextResponse.json({ error, problems }, { status, headers: { "Cache-Control": "no-store" } });
}

/** Admin session or a ready-made error response. Never reveals whether a tenant or import exists. */
export async function requireAdmin(requestedTenantId?: string | null): Promise<AdminContext | NextResponse> {
  const state = await getSessionState(requestedTenantId);
  if (state.kind === "anonymous") return jsonError(401, "Sign in to continue.");
  if (state.kind === "not-admin") return jsonError(403, "Only a tenant admin can use the Import Center.");
  return state;
}

export function isResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

/** Maps known failures to safe client messages; anything else becomes a generic 500. */
export function toErrorResponse(error: unknown) {
  if (error instanceof CsvFormatError) return jsonError(400, error.message);
  if (error instanceof ImportServiceError) {
    const status =
      error.code === "not_authorized" || error.code === "upload_failed"
        ? 403
        : error.code === "not_found" || error.code === "upload_not_found"
          ? 404
          : 400;
    return jsonError(status, error.message, error.problems);
  }
  if (error instanceof ConfigurationError) return jsonError(503, "The local Supabase stack is not configured.");
  return jsonError(500, "Something went wrong.");
}
