import Link from "next/link";
import { redirect } from "next/navigation";
import { AutoRefresh } from "../../src/components/auto-refresh";
import { Counts, ProgressBar, StatusBadge, isActive } from "../../src/components/import-progress";
import { listImports } from "../../src/import-center/service";
import { isSupabaseConfigured } from "../../src/server/env";
import { getSessionState } from "../../src/server/session";
import { signOut } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function ImportsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main>
        <h1>Import Center</h1>
        <p className="error">No local Supabase connection is configured. See .env.example.</p>
      </main>
    );
  }

  const state = await getSessionState();
  if (state.kind === "anonymous") redirect("/login");
  if (state.kind === "not-admin") {
    return (
      <main>
        <h1>Import Center</h1>
        <p>Only a tenant admin can use the Import Center. Signed in as {state.email}.</p>
        <form action={signOut}>
          <button type="submit">Sign out</button>
        </form>
      </main>
    );
  }

  const imports = await listImports(state.client);
  const anyActive = imports.some((row) => isActive(row.status));

  return (
    <main>
      <nav>
        <h1>Import Center · {state.tenantName}</h1>
        <form action={signOut}>
          <span className="muted">{state.email} </span>
          <button type="submit">Sign out</button>
        </form>
      </nav>
      <AutoRefresh active={anyActive} />
      <p>
        <Link href="/imports/new" className="button primary">
          New import
        </Link>
      </p>
      {imports.length === 0 ? (
        <p className="muted">No imports yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>File</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Started</th>
            </tr>
          </thead>
          <tbody>
            {imports.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/imports/${row.id}`}>{row.file_name}</Link>
                </td>
                <td>
                  <StatusBadge status={row.status} />
                </td>
                <td>
                  <ProgressBar row={row} />
                  <div className="muted">
                    <Counts row={row} />
                  </div>
                  {row.error_summary && <div className="error">{row.error_summary}</div>}
                </td>
                <td className="muted">{new Date(row.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
