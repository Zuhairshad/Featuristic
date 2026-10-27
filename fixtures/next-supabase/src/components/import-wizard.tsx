"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PreviewResult } from "../import-center/validation";

type Uploaded = {
  path: string;
  fileName: string;
  headers: string[];
  totalRows: number;
  suggestedMapping: Record<string, string>;
};

type ApiError = { error?: string; problems?: string[] };

async function readJson<T>(response: Response): Promise<T & ApiError> {
  return (await response.json().catch(() => ({ error: "Unexpected response." }))) as T & ApiError;
}

export function ImportWizard({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const [uploaded, setUploaded] = useState<Uploaded | null>(null);
  const [included, setIncluded] = useState<Record<string, boolean>>({});
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [isKey, setIsKey] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState<PreviewResult | null>(null);

  function fail(body: ApiError) {
    setProblems([body.error ?? "Request failed.", ...(body.problems ?? [])]);
  }

  function currentSelection() {
    if (!uploaded) return null;
    const mapping = Object.fromEntries(
      uploaded.headers.filter((header) => included[header]).map((header) => [header, keys[header] ?? ""]),
    );
    const keyColumns = uploaded.headers.filter((header) => included[header] && isKey[header]);
    return { mapping, keyColumns };
  }

  async function onUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProblems([]);
    setPreview(null);
    const form = new FormData(event.currentTarget);
    form.set("tenantId", tenantId);
    setBusy(true);
    try {
      const response = await fetch("/api/imports/upload", { method: "POST", body: form });
      const body = await readJson<Uploaded>(response);
      if (!response.ok) return fail(body);
      setUploaded(body);
      setIncluded(Object.fromEntries(body.headers.map((header) => [header, true])));
      setKeys(body.suggestedMapping);
      setIsKey({});
    } finally {
      setBusy(false);
    }
  }

  async function post<T>(url: string): Promise<(T & ApiError) | null> {
    const selection = currentSelection();
    if (!uploaded || !selection) return null;
    setProblems([]);
    setBusy(true);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          path: uploaded.path,
          fileName: uploaded.fileName,
          mapping: selection.mapping,
          keyColumns: selection.keyColumns,
        }),
      });
      const body = await readJson<T>(response);
      if (!response.ok) {
        fail(body);
        return null;
      }
      return body;
    } finally {
      setBusy(false);
    }
  }

  async function onPreview() {
    const result = await post<PreviewResult>("/api/imports/preview");
    if (result) setPreview(result);
  }

  async function onStart() {
    const result = await post<{ id: string }>("/api/imports");
    if (result) router.push(`/imports/${result.id}`);
  }

  return (
    <div>
      <form onSubmit={onUpload} className="card">
        <h2>1. Upload a CSV</h2>
        <p className="muted">CSV only, up to 5 MB and 10,000 data rows. The first row must be a header row.</p>
        <div className="row">
          <input name="file" type="file" accept=".csv,text/csv" required aria-label="CSV file" />
          <button type="submit" disabled={busy}>
            Upload
          </button>
        </div>
      </form>

      {problems.length > 0 && (
        <div className="card error" role="alert">
          <ul>
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      )}

      {uploaded && (
        <div className="card">
          <h2>2. Map columns</h2>
          <p className="muted">
            {uploaded.fileName}: {uploaded.totalRows.toLocaleString()} data rows. Choose which columns to import,
            their field names, and which columns identify a record. Rows with the same key (ignoring case and extra
            spaces) as an existing or earlier row are skipped and listed as errors; stored data is never overwritten.
          </p>
          <table>
            <thead>
              <tr>
                <th>Import</th>
                <th>CSV column</th>
                <th>Field name</th>
                <th>Key</th>
              </tr>
            </thead>
            <tbody>
              {uploaded.headers.map((header) => (
                <tr key={header}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Import ${header}`}
                      checked={included[header] ?? false}
                      onChange={(event) => setIncluded({ ...included, [header]: event.target.checked })}
                    />
                  </td>
                  <td>{header}</td>
                  <td>
                    <input
                      type="text"
                      aria-label={`Field name for ${header}`}
                      value={keys[header] ?? ""}
                      disabled={!included[header]}
                      onChange={(event) => setKeys({ ...keys, [header]: event.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Use ${header} as key`}
                      checked={isKey[header] ?? false}
                      disabled={!included[header]}
                      onChange={(event) => setIsKey({ ...isKey, [header]: event.target.checked })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            <button type="button" onClick={onPreview} disabled={busy}>
              Validate and preview
            </button>
          </p>
        </div>
      )}

      {preview && (
        <div className="card">
          <h2>3. Review</h2>
          <p>
            <strong>{preview.importableRows.toLocaleString()}</strong> of {preview.totalRows.toLocaleString()} rows
            will be imported. {preview.invalidRows.toLocaleString()} invalid,{" "}
            {preview.duplicateInFileRows.toLocaleString()} repeated in this file,{" "}
            {preview.duplicateExistingRows.toLocaleString()} already imported. Nothing has been written yet.
          </p>
          {preview.issues.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th title="Data row number: the header is not counted and blank lines are ignored">Data row</th>
                  <th>Problem</th>
                </tr>
              </thead>
              <tbody>
                {preview.issues.map((issue) => (
                  <tr key={`${issue.rowNumber}-${issue.code}`}>
                    <td>{issue.rowNumber}</td>
                    <td>{issue.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {preview.issuesTruncated && <p className="muted">Only the first problems are shown. The full list is downloadable after the import.</p>}
          <p>
            <button type="button" className="primary" onClick={onStart} disabled={busy || preview.importableRows === 0}>
              Start import
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
