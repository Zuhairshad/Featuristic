import { describe, expect, it } from "vitest";
import { canReplayImport } from "./service";

describe("canReplayImport", () => {
  const now = new Date("2026-01-01T00:10:00Z");
  const at = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60_000).toISOString();

  it("offers replay for failed imports", () => {
    expect(canReplayImport({ status: "failed", heartbeat_at: at(0) }, now)).toBe(true);
  });
  it("offers replay for queued or running imports only after a five-minute stale heartbeat", () => {
    for (const status of ["queued", "running"] as const) {
      expect(canReplayImport({ status, heartbeat_at: at(4) }, now)).toBe(false);
      expect(canReplayImport({ status, heartbeat_at: at(6) }, now)).toBe(true);
    }
  });
  it("never offers replay for completed imports", () => {
    expect(canReplayImport({ status: "completed", heartbeat_at: at(60) }, now)).toBe(false);
  });
});
