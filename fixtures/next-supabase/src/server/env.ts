/**
 * Environment access for the local reference host. Values are read lazily so the app builds and
 * renders its "not configured" state without a Supabase stack. Nothing here is ever rendered.
 */

export class ConfigurationError extends Error {}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new ConfigurationError(`${name} is not set.`);
  return value;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function sessionEnv(): { url: string; publishableKey: string } {
  return {
    url: required("NEXT_PUBLIC_SUPABASE_URL"),
    publishableKey: required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  };
}

/** Server-only. The service-role key is never prefixed NEXT_PUBLIC_ and never sent to the browser. */
export function serviceEnv(): { url: string; serviceRoleKey: string } {
  return {
    url: required("NEXT_PUBLIC_SUPABASE_URL"),
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

/** The worker endpoint is disabled unless a shared secret is configured. */
export function workerSecret(): string | null {
  return process.env.IMPORT_WORKER_SECRET || null;
}
