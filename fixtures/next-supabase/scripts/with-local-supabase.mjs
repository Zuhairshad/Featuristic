// Runs a command with connection settings for the LOCAL Supabase stack only.
// Usage: node scripts/with-local-supabase.mjs <command> [args...]
// Requires `pnpm supabase:start` to have been run. Refuses any non-loopback URL, so a hosted project
// can never be targeted through this script.
import { spawn, spawnSync } from "node:child_process";

const status = spawnSync("supabase", ["status", "-o", "json"], { encoding: "utf8" });
if (status.status !== 0) {
  console.error("Could not read local Supabase status. Start the stack first: pnpm supabase:start");
  console.error(status.stderr?.trim() || status.error?.message || "");
  process.exit(1);
}

let values;
try {
  values = JSON.parse(status.stdout);
} catch {
  console.error("Unexpected output from `supabase status -o json`.");
  process.exit(1);
}

const { API_URL, DB_URL, PUBLISHABLE_KEY, ANON_KEY, SERVICE_ROLE_KEY } = values;
const loopback = (value) => {
  try {
    return ["127.0.0.1", "localhost", "::1", "[::1]"].includes(new URL(value).hostname);
  } catch {
    return false;
  }
};
if (!API_URL || !DB_URL || !loopback(API_URL) || !loopback(DB_URL)) {
  console.error("Refusing to run: Supabase URLs are missing or not loopback addresses.");
  process.exit(1);
}

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("No command given.");
  process.exit(1);
}

const child = spawn(command, args, {
  stdio: "inherit",
  env: {
    ...process.env,
    LOCAL_SUPABASE_API_URL: API_URL,
    LOCAL_SUPABASE_DB_URL: DB_URL,
    LOCAL_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE_KEY ?? ANON_KEY,
    LOCAL_SUPABASE_SERVICE_ROLE_KEY: SERVICE_ROLE_KEY,
  },
});
child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
