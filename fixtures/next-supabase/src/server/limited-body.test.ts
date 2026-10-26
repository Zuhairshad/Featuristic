import { describe, expect, it } from "vitest";
import { BodyTooLargeError, InvalidContentLengthError, readBodyWithLimit } from "./limited-body";

/** A body that counts how many bytes were actually pulled from it. */
function countingBody(chunkBytes: number, chunks: number) {
  const state = { pulled: 0, cancelled: false };
  let sent = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent >= chunks) return controller.close();
      sent++;
      state.pulled += chunkBytes;
      controller.enqueue(new Uint8Array(chunkBytes));
    },
    cancel() {
      state.cancelled = true;
    },
  });
  return { stream, state };
}

function post(body: ReadableStream<Uint8Array> | string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/upload", {
    method: "POST",
    body,
    headers,
    // Required by Node's fetch for streaming bodies.
    ...(typeof body === "string" ? {} : { duplex: "half" }),
  } as RequestInit);
}

describe("readBodyWithLimit", () => {
  it("returns a body within the cap", async () => {
    const bytes = await readBodyWithLimit(post("hello"), 10);
    expect(new TextDecoder().decode(bytes)).toBe("hello");
  });

  it("rejects an over-limit body without a Content-Length header, and stops reading early", async () => {
    const { stream, state } = countingBody(1024, 1000);
    const request = post(stream);
    expect(request.headers.get("content-length")).toBeNull();
    await expect(readBodyWithLimit(request, 4096)).rejects.toBeInstanceOf(BodyTooLargeError);
    expect(state.cancelled).toBe(true);
    expect(state.pulled).toBeLessThan(1024 * 100);
  });

  it("rejects a forged small Content-Length when the real body is larger", async () => {
    const { stream, state } = countingBody(1024, 1000);
    const request = post(stream, { "content-length": "10" });
    await expect(readBodyWithLimit(request, 4096)).rejects.toBeInstanceOf(BodyTooLargeError);
    expect(state.cancelled).toBe(true);
  });

  it("rejects a declared over-limit length before reading anything", async () => {
    const { stream, state } = countingBody(1024, 10);
    const request = post(stream, { "content-length": "999999999" });
    await expect(readBodyWithLimit(request, 4096)).rejects.toBeInstanceOf(BodyTooLargeError);
    expect(state.pulled).toBeLessThanOrEqual(1024);
  });

  it("rejects a malformed Content-Length", async () => {
    await expect(readBodyWithLimit(post("x", { "content-length": "12abc" }), 100)).rejects.toBeInstanceOf(
      InvalidContentLengthError,
    );
  });
});
