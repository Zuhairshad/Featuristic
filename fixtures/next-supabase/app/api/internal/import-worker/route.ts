import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { workerSecret } from "../../../../src/server/env";
import { jsonError, toErrorResponse } from "../../../../src/server/http";
import { MAX_MESSAGES_PER_RUN, runImportWorkerOnce } from "../../../../src/server/run-worker";

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/**
 * Internally authenticated worker trigger (local development / operator command). It is a bounded,
 * deliberate invocation, not a scheduler. Example:
 *   curl -X POST -H "Authorization: Bearer $IMPORT_WORKER_SECRET" "http://localhost:3000/api/internal/import-worker?max=5"
 */
export async function POST(request: Request) {
  const secret = workerSecret();
  if (!secret) return jsonError(503, "The worker endpoint is disabled.");

  const presented = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!timingSafeEqual(digest(presented), digest(secret))) return jsonError(401, "Unauthorized.");

  try {
    const requested = Number(new URL(request.url).searchParams.get("max") ?? 1);
    const max = Number.isFinite(requested) ? requested : 1;
    const outcomes = await runImportWorkerOnce(Math.min(max, MAX_MESSAGES_PER_RUN));
    return NextResponse.json({ outcomes }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
