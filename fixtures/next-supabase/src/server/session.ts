import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sessionEnv } from "./env";

/** Supabase client bound to the caller's cookie session. Every query runs under the caller's RLS. */
export async function createSessionClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const { url, publishableKey } = sessionEnv();
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component, which cannot set cookies; proxy.ts refreshes the session.
        }
      },
    },
  });
}

export type AdminContext = {
  client: SupabaseClient;
  userId: string;
  email: string | undefined;
  tenantId: string;
  tenantName: string;
};

export type SessionState =
  | { kind: "anonymous" }
  | { kind: "not-admin"; email: string | undefined }
  | ({ kind: "admin" } & AdminContext);

/**
 * Resolves the caller from the verified session (getUser validates the JWT with Auth) and finds a
 * tenant they administer through RLS-protected reads. The optional requested tenant is only a
 * selector among tenants the caller already administers; it grants nothing by itself.
 */
export async function getSessionState(requestedTenantId?: string | null): Promise<SessionState> {
  const client = await createSessionClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { kind: "anonymous" };

  const { data: memberships } = await client
    .from("tenant_members")
    .select("tenant_id, role, tenants(name)")
    .eq("user_id", data.user.id)
    .eq("role", "admin");

  const admin = (memberships ?? []) as unknown as { tenant_id: string; tenants: { name: string } | null }[];
  const chosen = admin.find((row) => row.tenant_id === requestedTenantId) ?? admin[0];
  if (!chosen) return { kind: "not-admin", email: data.user.email };

  return {
    kind: "admin",
    client,
    userId: data.user.id,
    email: data.user.email,
    tenantId: chosen.tenant_id,
    tenantName: chosen.tenants?.name ?? "Workspace",
  };
}
