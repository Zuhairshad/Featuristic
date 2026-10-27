import type { SupabaseClient } from "@supabase/supabase-js";

export type ConfiguredSupabaseClient = SupabaseClient;

/**
 * "local-only": the Import Center reference host uses Supabase through the local CLI stack
 * (fixtures/next-supabase/supabase). No hosted project, URL, or credential is committed.
 */
export const supabaseConfigurationStatus = "local-only";
