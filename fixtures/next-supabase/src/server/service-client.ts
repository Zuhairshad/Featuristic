import { createClient } from "@supabase/supabase-js";
import { serviceEnv } from "./env";

/**
 * Bypass-RLS client for the background worker only. Import it from worker entry points, never from
 * pages or user-facing routes.
 */
export function createServiceClient() {
  const { url, serviceRoleKey } = serviceEnv();
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
