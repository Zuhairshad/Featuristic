import Link from "next/link";
import { supabaseConfigurationStatus } from "../src/lib/supabase";
import { isSupabaseConfigured } from "../src/server/env";

export default function HomePage() {
  return (
    <main>
      <h1>FeatureKit fixture</h1>
      <p>Supabase configuration: {supabaseConfigurationStatus}</p>
      <p className="muted">
        {isSupabaseConfigured()
          ? "A local Supabase connection is configured for this process."
          : "No local Supabase connection is configured. Copy .env.example to .env.local after starting the local stack."}
      </p>
      <p>
        <Link href="/imports">Import Center</Link>
      </p>
    </main>
  );
}
