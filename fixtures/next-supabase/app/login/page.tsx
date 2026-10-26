import { isSupabaseConfigured } from "../../src/server/env";
import { signIn } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main>
      <h1>Sign in</h1>
      {!isSupabaseConfigured() && <p className="error">No local Supabase connection is configured.</p>}
      <p className="muted">
        Local development accounts come from <code>supabase/seed.sql</code> (for example{" "}
        <code>admin-a@example.test</code>, password <code>local-dev-password</code>). They exist only in the local
        stack.
      </p>
      {error && <p className="error">Sign-in failed. Check the email and password.</p>}
      <form action={signIn} className="card">
        <p>
          <label>
            Email <input name="email" type="email" required autoComplete="username" />
          </label>
        </p>
        <p>
          <label>
            Password <input name="password" type="password" required autoComplete="current-password" />
          </label>
        </p>
        <button type="submit" className="primary">
          Sign in
        </button>
      </form>
    </main>
  );
}
