import type { ImportSummary } from "../import-center/service";

const LABELS: Record<ImportSummary["status"], string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};

export function isActive(status: ImportSummary["status"]): boolean {
  return status === "queued" || status === "running";
}

export function StatusBadge({ status }: { status: ImportSummary["status"] }) {
  const className = status === "failed" ? "badge error" : status === "completed" ? "badge ok" : "badge";
  return <span className={className}>{LABELS[status]}</span>;
}

export function ProgressBar({ row }: { row: ImportSummary }) {
  return (
    <progress
      value={row.cursor}
      max={row.total_rows}
      aria-label={`${row.cursor} of ${row.total_rows} rows processed`}
    />
  );
}

export function Counts({ row }: { row: ImportSummary }) {
  const skipped = row.duplicate_count + row.invalid_count;
  return (
    <span>
      {row.cursor.toLocaleString()} / {row.total_rows.toLocaleString()} rows · {row.imported_count.toLocaleString()}{" "}
      imported · {skipped.toLocaleString()} skipped ({row.duplicate_count.toLocaleString()} duplicate,{" "}
      {row.invalid_count.toLocaleString()} invalid)
    </span>
  );
}
