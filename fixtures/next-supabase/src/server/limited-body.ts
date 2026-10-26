import { IMPORT_LIMITS } from "../import-center/limits";

/** Multipart framing allowance on top of the file cap; the file itself is re-checked after parsing. */
export const UPLOAD_BODY_LIMIT_BYTES = IMPORT_LIMITS.maxFileBytes + 64 * 1024;
export const JSON_BODY_LIMIT_BYTES = 64 * 1024;

export type BodyResult<T> = { ok: true; value: T } | { ok: false; status: 400 | 413; error: string };

const TOO_LARGE = "The request is larger than the allowed size.";

/**
 * Reads a request body into memory but stops as soon as more than `maxBytes` arrive. Content-Length
 * is only an early hint: a missing, malformed, or understated header cannot make us buffer more,
 * because the byte count is enforced on the stream itself (including chunked bodies).
 */
export async function readBodyLimited(request: Request, maxBytes: number): Promise<BodyResult<Uint8Array>> {
  const declared = request.headers.get("content-length");
  if (declared !== null) {
    const length = Number(declared);
    if (!/^\d+$/.test(declared.trim()) || !Number.isSafeInteger(length)) {
      return { ok: false, status: 400, error: "Invalid Content-Length." };
    }
    if (length > maxBytes) return { ok: false, status: 413, error: TOO_LARGE };
  }
  if (!request.body) return { ok: true, value: new Uint8Array() };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return { ok: false, status: 413, error: TOO_LARGE };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, value: bytes };
}

export async function readUploadForm(request: Request): Promise<BodyResult<FormData>> {
  const body = await readBodyLimited(request, UPLOAD_BODY_LIMIT_BYTES);
  if (!body.ok) return body;
  try {
    const form = await new Response(body.value as BodyInit, {
      headers: { "content-type": request.headers.get("content-type") ?? "" },
    }).formData();
    return { ok: true, value: form };
  } catch {
    return { ok: false, status: 400, error: "Invalid upload." };
  }
}

export async function readJsonLimited(request: Request): Promise<BodyResult<unknown>> {
  const body = await readBodyLimited(request, JSON_BODY_LIMIT_BYTES);
  if (!body.ok) return body;
  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(body.value)) };
  } catch {
    return { ok: false, status: 400, error: "Invalid request." };
  }
}
