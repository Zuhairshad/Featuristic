import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AutoRefresh } from "../../../src/components/auto-refresh";
import { Counts, ProgressBar, StatusBadge, isActive } from "../../../src/components/import-progress";
import { getImport, listRowErrors } from "../../../src/import-center/service";
import { getSessionState } from "../../../src/server/session";
import { replayAction } from "./actions";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ERROR_PREVIEW_ROWS = 20;

export default async function ImportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ replay?: string }>;
}) {
  const { id } = await params;
  const { replay } = await searchParams;
  if (!UUID.test(id)) notFound();

  const state = await getSessionState();
  if (state.kind === "anonymous") redirect("/login");
  if (state.kind === "not-admin") notFound();

  // RLS: another tenant's import is simply absent, exactly like a nonexistent id.
  const row = await getImport(state.client, id);
  if (!row) notFound();

  const errors = (await listRowErrors(state.client, id)).slice(0, ERROR_PREVIEW_ROWS);
  const skipped = row.duplicate_count + row.invalid_count;
  const canReplay = row.status === "failed";

  return (
    <main>
      <p>
        <Link href="/imports">← All imports</Link>
      </p>
      <AutoRefresh active={isActive(row.status)} />
      <h1>{row.file_name}</h1>
      <div className="card">
        <div className="row">
          <StatusBadge status={row.status} />
          <span className="muted">Run {row.run_id}</span>
        </div>
        <p>
          <ProgressBar row={row} />
          <Counts row={row} />
        </p>
        {row.error_summary && <p className="error">{row.error_summary}</p>}
        {row.status === "queued" && (
          <p className="muted">
            Waiting for the background worker. Nothing in this host runs it automatically; an operator starts it
            with the internally authenticated worker endpoint.
          </p>
        )}
        {replay === "unavailable" && <p className="error">This import cannot be replayed right now.</p>}
        <div className="row">
          {canReplay && (
            <form action={replayAction}>
              <input type="hidden" name="id" value={id} />
              <button type="submit">Replay from last saved row</button>
            </form>
          )}
          {skipped > 0 && (
            <a className="button" href={`/api/imports/${id}/errors`} download>
              Download row errors (CSV)
            </a>
          )}
        </div>
      </div>

      {errors.length > 0 && (
        <>
          <h2>Row errors</h2>
          <table>
            <thead>
              <tr>
                <th>Row</th>
                <th>Problem</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((error) => (
                <tr key={error.row_number}>
                  <td>{error.row_number}</td>
                  <td>{error.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {skipped > errors.length && <p className="muted">Showing the first {errors.length}. Download for all.</p>}
        </>
      )}
    </main>
  );
}
