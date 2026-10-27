import { beforeEach, describe, expect, it, vi } from "vitest";

const memberships = vi.hoisted(() => ({ rows: [] as { tenant_id: string; tenants: { name: string } | null }[] }));

vi.mock("next/headers", () => ({ cookies: async () => ({ getAll: () => [], set: () => undefined }) }));
vi.mock("./env", () => ({ sessionEnv: () => ({ url: "http://127.0.0.1:54321", publishableKey: "k" }) }));
vi.mock("@supabase/ssr", () => {
  const query = {
    select: () => query,
    eq: () => query,
    order: async () => ({ data: memberships.rows }),
  };
  return {
    createServerClient: () => ({
      auth: { getUser: async () => ({ data: { user: { id: "u1", email: "a@example.test" } }, error: null }) },
      from: () => query,
    }),
  };
});

import { getSessionState } from "./session";

const A = "aaaaaaaa-0000-4000-8000-000000000001";
const B = "bbbbbbbb-0000-4000-8000-000000000002";
const C = "cccccccc-0000-4000-8000-000000000003";

describe("getSessionState tenant selection", () => {
  beforeEach(() => {
    memberships.rows = [
      { tenant_id: A, tenants: { name: "A" } },
      { tenant_id: B, tenants: { name: "B" } },
    ];
  });

  it("defaults to the first administered tenant when none is requested", async () => {
    expect(await getSessionState()).toMatchObject({ kind: "admin", tenantId: A });
  });

  it("selects a requested tenant the caller administers", async () => {
    expect(await getSessionState(B)).toMatchObject({ kind: "admin", tenantId: B });
  });

  it("rejects a requested tenant the caller does not administer instead of falling back", async () => {
    expect(await getSessionState(C)).toMatchObject({ kind: "not-admin" });
  });
});
