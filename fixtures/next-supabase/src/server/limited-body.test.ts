import { describe, expect, it } from "vitest";
import { IMPORT_LIMITS } from "../import-center/limits";
import { UPLOAD_BODY_LIMIT_BYTES, readBodyLimited, readJsonLimited, readUploadForm } from "./limited-body";

/** A request whose body is delivered as a stream of chunks, with the headers we choose to send. */
function streamed(totalBytes: number, headers: Record<string, string> = {}, chunkBytes = 64 * 1024) {
  let sent = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent >= totalBytes) return controller.close();
      const size = Math.min(chunkBytes, totalBytes - sent);
      sent += size;
      controller.enqueue(new Uint8Array(size));
    },
  });
  const request = new Request("http://localhost/api/imports/upload", { method: "POST", headers, body, duplex: "half" } as RequestInit);
  return { request, sentBytes: () => sent };
}

const OVER = UPLOAD_BODY_LIMIT_BYTES + 1024 * 1024;

describe("readBodyLimited", () => {
  it("rejects an oversized body that omits Content-Length, and stops reading early", async () => {
    const { request, sentBytes } = streamed(OVER);
    expect(request.headers.get("content-length")).toBeNull();
    const result = await readBodyLimited(request, UPLOAD_BODY_LIMIT_BYTES);
    expect(result).toMatchObject({ ok: false, status: 413 });
    // The producer was cancelled soon after the cap instead of being drained to the end.
    expect(sentBytes()).toBeLessThan(OVER);
  });

  it("rejects an oversized body whose Content-Length is forged to look small", async () => {
    const { request } = streamed(OVER, { "content-length": "100" });
    expect(await readBodyLimited(request, UPLOAD_BODY_LIMIT_BYTES)).toMatchObject({ ok: false, status: 413 });
  });

  it("rejects an over-limit declared length before reading anything", async () => {
    const { request, sentBytes } = streamed(OVER, { "content-length": String(OVER) });
    expect(await readBodyLimited(request, UPLOAD_BODY_LIMIT_BYTES)).toMatchObject({ ok: false, status: 413 });
    // The helper never touched the body. The stream constructor itself prefetches one chunk (64 KiB).
    expect(request.bodyUsed).toBe(false);
    expect(sentBytes()).toBeLessThanOrEqual(64 * 1024);
  });

  it.each(["abc", "-5", "1e3", "12 34", ""])("rejects a malformed Content-Length %j", async (value) => {
    const { request } = streamed(10, { "content-length": value });
    expect(await readBodyLimited(request, 1024)).toMatchObject({ ok: false, status: 400 });
  });

  it("accepts a body within the limit and returns every byte", async () => {
    const { request } = streamed(300_000, {}, 10_000);
    const result = await readBodyLimited(request, UPLOAD_BODY_LIMIT_BYTES);
    expect(result.ok && result.value.byteLength).toBe(300_000);
  });
});

describe("readUploadForm", () => {
  it("parses a file within the limit", async () => {
    const form = new FormData();
    form.set("file", new File(["a,b\n1,2\n"], "ok.csv", { type: "text/csv" }));
    form.set("tenantId", "t");
    const request = new Request("http://localhost/x", { method: "POST", body: form });
    const result = await readUploadForm(request);
    expect(result.ok).toBe(true);
    if (result.ok) expect((result.value.get("file") as File).name).toBe("ok.csv");
  });

  it("rejects an oversized multipart upload that omits Content-Length", async () => {
    const boundary = "x";
    const head = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="big.csv"\r\nContent-Type: text/csv\r\n\r\n`;
    const payload = new Uint8Array(IMPORT_LIMITS.maxFileBytes + 2 * 1024 * 1024).fill(97);
    const tail = `\r\n--${boundary}--\r\n`;
    const parts = [new TextEncoder().encode(head), payload, new TextEncoder().encode(tail)];
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const part of parts) controller.enqueue(part);
        controller.close();
      },
    });
    const request = new Request("http://localhost/x", {
      method: "POST",
      headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
      body,
      duplex: "half",
    } as RequestInit);
    expect(request.headers.get("content-length")).toBeNull();
    expect(await readUploadForm(request)).toMatchObject({ ok: false, status: 413 });
  });

  it("returns 400 for a body that is not valid multipart", async () => {
    const request = new Request("http://localhost/x", {
      method: "POST",
      headers: { "content-type": "multipart/form-data; boundary=zzz" },
      body: "not multipart",
    });
    expect(await readUploadForm(request)).toMatchObject({ ok: false, status: 400 });
  });
});

describe("readJsonLimited", () => {
  it("parses small JSON and rejects bad JSON and oversized bodies", async () => {
    const post = (body: string) => new Request("http://localhost/x", { method: "POST", body });
    expect(await readJsonLimited(post('{"a":1}'))).toEqual({ ok: true, value: { a: 1 } });
    expect(await readJsonLimited(post("{nope"))).toMatchObject({ ok: false, status: 400 });
    expect(await readJsonLimited(post(JSON.stringify({ pad: "x".repeat(70_000) })))).toMatchObject({ ok: false, status: 413 });
  });
});
