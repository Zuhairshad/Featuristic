import { beforeEach, describe, expect, it, vi } from "vitest";
import { IMPORT_LIMITS } from "../import-center/limits";

const uploadCsv = vi.fn();
const requireAdmin = vi.fn();

vi.mock("../import-center/service", () => ({ uploadCsv: (...args: unknown[]) => uploadCsv(...args) }));
vi.mock("./http", async () => {
  const actual = await vi.importActual<typeof import("./http")>("./http");
  return { ...actual, requireAdmin: (...args: unknown[]) => requireAdmin(...args) };
});

const { POST } = await import("../../app/api/imports/upload/route");

const admin = { client: {}, userId: "u", email: undefined, tenantId: "t", tenantName: "T" };

function oversizedStream(totalBytes: number) {
  const state = { pulled: 0, cancelled: false };
  const chunk = 64 * 1024;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (state.pulled >= totalBytes) return controller.close();
      state.pulled += chunk;
      controller.enqueue(new Uint8Array(chunk));
    },
    cancel() {
      state.cancelled = true;
    },
  });
  return { stream, state };
}

function upload(body: ReadableStream<Uint8Array>, headers: Record<string, string>) {
  return new Request("http://localhost/api/imports/upload", {
    method: "POST",
    body,
    headers: { "content-type": "multipart/form-data; boundary=xyz", ...headers },
    duplex: "half",
  } as RequestInit);
}

describe("POST /api/imports/upload size enforcement", () => {
  beforeEach(() => {
    uploadCsv.mockReset();
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(admin);
  });

  it("rejects an oversized body with no Content-Length before parsing or storing it", async () => {
    const { stream, state } = oversizedStream(IMPORT_LIMITS.maxFileBytes * 20);
    const response = await POST(upload(stream, {}));
    expect(response.status).toBe(413);
    expect(uploadCsv).not.toHaveBeenCalled();
    expect(state.cancelled).toBe(true);
    expect(state.pulled).toBeLessThan(IMPORT_LIMITS.maxFileBytes * 2);
  });

  it("rejects an oversized body with a forged small Content-Length", async () => {
    const { stream, state } = oversizedStream(IMPORT_LIMITS.maxFileBytes * 20);
    const response = await POST(upload(stream, { "content-length": "100" }));
    expect(response.status).toBe(413);
    expect(uploadCsv).not.toHaveBeenCalled();
    expect(state.cancelled).toBe(true);
  });

  it("rejects a malformed Content-Length", async () => {
    const { stream } = oversizedStream(1024);
    const response = await POST(upload(stream, { "content-length": "abc" }));
    expect(response.status).toBe(400);
    expect(uploadCsv).not.toHaveBeenCalled();
  });

  it("still accepts a small valid CSV upload", async () => {
    uploadCsv.mockResolvedValue({ path: "t/x.csv", sha256: "a", headers: ["Email"], totalRows: 1 });
    const form = new FormData();
    form.set("file", new File(["Email\na@example.test\n"], "people.csv", { type: "text/csv" }));
    const request = new Request("http://localhost/api/imports/upload", { method: "POST", body: form });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(uploadCsv).toHaveBeenCalledTimes(1);
  });
});
