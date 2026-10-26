export class BodyTooLargeError extends Error {}
export class InvalidContentLengthError extends Error {}

/**
 * Reads a request body into memory without ever holding more than `maxBytes`. The declared
 * Content-Length is only an early rejection: a missing or forged header cannot raise the cap because
 * bytes are counted while streaming and the stream is cancelled as soon as the cap is exceeded.
 */
export async function readBodyWithLimit(request: Request, maxBytes: number): Promise<Uint8Array> {
  const declared = request.headers.get("content-length");
  if (declared !== null) {
    if (!/^\d+$/.test(declared)) throw new InvalidContentLengthError();
    if (Number(declared) > maxBytes) {
      await request.body?.cancel().catch(() => undefined);
      throw new BodyTooLargeError();
    }
  }
  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new BodyTooLargeError();
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

/** Parses multipart form data from a body that has already been size-checked. */
export async function parseFormData(request: Request, body: Uint8Array): Promise<FormData> {
  const contentType = request.headers.get("content-type") ?? "";
  return new Response(body as BodyInit, { headers: { "content-type": contentType } }).formData();
}
