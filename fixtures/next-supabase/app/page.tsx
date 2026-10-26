import { supabaseConfigurationStatus } from "../src/lib/supabase";

export default function HomePage() {
  return (
    <main>
      <h1>FeatureKit fixture</h1>
      <p>Supabase configuration: {supabaseConfigurationStatus}</p>
    </main>
  );
}
