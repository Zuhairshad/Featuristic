import { IMPORT_LIMITS } from "./limits";

/** CSV header -> payload key. Unmapped headers are ignored. */
export type Mapping = Record<string, string>;

export type RowErrorCode =
  | "column_count_mismatch"
  | "missing_key"
  | "value_too_long"
  | "duplicate_in_file"
  | "duplicate_existing";

export type RowIssue = {
  rowNumber: number;
  code: RowErrorCode;
  message: string;
  /** Original cell values by CSV header, so the user can fix and re-upload. */
  values: Record<string, string>;
};

export type ValidRow = {
  rowNumber: number;
  dedupeKey: string;
  payload: Record<string, string>;
  values: Record<string, string>;
};

const PAYLOAD_KEY = /^[a-z][a-z0-9_]{0,62}$/;

/** Suggests a payload key for a header, e.g. "Email Address" -> "email_address". */
export function suggestPayloadKey(header: string): string {
  const key = header
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/^[^a-z]+/, "");
  return key.slice(0, 63);
}

/** Returns human-readable configuration problems; an empty array means the mapping is usable. */
export function validateMapping(headers: string[], mapping: Mapping, keyColumns: string[]): string[] {
  const problems: string[] = [];
  const known = new Set(headers);
  const targets = new Map<string, string>();

  for (const [header, key] of Object.entries(mapping)) {
    if (!known.has(header)) {
      problems.push(`Mapped column "${header}" is not in the file.`);
    }
    if (!PAYLOAD_KEY.test(key)) {
      problems.push(`"${key}" is not a valid field name (lowercase letters, digits, underscores; must start with a letter).`);
    }
    const clash = targets.get(key);
    if (clash) {
      problems.push(`Columns "${clash}" and "${header}" both map to "${key}".`);
    }
    targets.set(key, header);
  }

  if (Object.keys(mapping).length === 0) {
    problems.push("Map at least one column.");
  }
  if (keyColumns.length === 0) {
    problems.push("Choose at least one key column for duplicate detection.");
  }
  if (keyColumns.length > IMPORT_LIMITS.maxKeyColumns) {
    problems.push(`Choose at most ${IMPORT_LIMITS.maxKeyColumns} key columns.`);
  }
  for (const column of new Set(keyColumns)) {
    if (!(column in mapping)) {
      problems.push(`Key column "${column}" must also be mapped.`);
    }
  }
  if (new Set(keyColumns).size !== keyColumns.length) {
    problems.push("Key columns must be unique.");
  }
  return problems;
}

/** v1 normalization: Unicode NFKC, trim, collapse internal whitespace, lowercase. */
export function normalizeKeyPart(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

/** Tenant scoping is applied by the database; this string is the per-tenant identity of a row. */
export function buildDedupeKey(parts: string[]): string {
  return JSON.stringify(parts.map(normalizeKeyPart));
}

export type ValidatedRows = { valid: ValidRow[]; invalid: RowIssue[] };

/**
 * Validates data rows [startIndex, endIndex) and returns every row exactly once, either valid or
 * invalid. Duplicate detection against stored data happens in the database commit.
 */
export function validateRows(
  headers: string[],
  rows: string[][],
  mapping: Mapping,
  keyColumns: string[],
  startIndex = 0,
  endIndex = rows.length,
): ValidatedRows {
  const valid: ValidRow[] = [];
  const invalid: RowIssue[] = [];
  const headerIndex = new Map(headers.map((header, index) => [header, index]));

  for (let index = startIndex; index < Math.min(endIndex, rows.length); index++) {
    const rowNumber = index + 1;
    const cells = rows[index] ?? [];
    const values = Object.fromEntries(headers.map((header, column) => [header, cells[column] ?? ""]));

    if (cells.length !== headers.length) {
      invalid.push({
        rowNumber,
        code: "column_count_mismatch",
        message: `Expected ${headers.length} columns but found ${cells.length}.`,
        values,
      });
      continue;
    }

    const longColumn = headers.find((header) => (values[header] ?? "").length > IMPORT_LIMITS.maxCellLength);
    if (longColumn) {
      invalid.push({
        rowNumber,
        code: "value_too_long",
        message: `Column "${longColumn}" is longer than ${IMPORT_LIMITS.maxCellLength} characters.`,
        values: {},
      });
      continue;
    }

    const keyParts = keyColumns.map((column) => (values[column] ?? "").trim());
    const emptyKey = keyColumns.find((_, position) => keyParts[position] === "");
    if (emptyKey !== undefined) {
      invalid.push({
        rowNumber,
        code: "missing_key",
        message: `Key column "${emptyKey}" is empty.`,
        values,
      });
      continue;
    }

    const payload: Record<string, string> = {};
    for (const [header, key] of Object.entries(mapping)) {
      const column = headerIndex.get(header);
      payload[key] = column === undefined ? "" : (cells[column] ?? "").trim();
    }
    valid.push({ rowNumber, dedupeKey: buildDedupeKey(keyParts), payload, values });
  }

  return { valid, invalid };
}

export type PreviewResult = {
  totalRows: number;
  importableRows: number;
  invalidRows: number;
  duplicateInFileRows: number;
  duplicateExistingRows: number;
  /** First `limit` problems in row order. */
  issues: RowIssue[];
  issuesTruncated: boolean;
  sample: Record<string, string>[];
};

/** Dry-run of what the worker will do. `existingKeys` are normalized keys already stored for the tenant. */
export function previewRows(
  headers: string[],
  rows: string[][],
  mapping: Mapping,
  keyColumns: string[],
  existingKeys: ReadonlySet<string>,
  limits: { issueLimit: number; sampleRows: number } = {
    issueLimit: IMPORT_LIMITS.previewErrorLimit,
    sampleRows: IMPORT_LIMITS.previewSampleRows,
  },
): PreviewResult {
  const { valid, invalid } = validateRows(headers, rows, mapping, keyColumns);
  const firstSeen = new Map<string, number>();
  const issues: RowIssue[] = [...invalid];
  let duplicateInFile = 0;
  let duplicateExisting = 0;
  let importable = 0;

  for (const row of valid) {
    // Mirrors commit_import_batch: a key already stored for the tenant (any earlier import) makes every
    // row with that key duplicate_existing. Only keys new to storage can be duplicate_in_file.
    if (existingKeys.has(row.dedupeKey)) {
      duplicateExisting++;
      issues.push({
        rowNumber: row.rowNumber,
        code: "duplicate_existing",
        message: "Duplicate key: a record with this key was already imported. Row would be skipped.",
        values: row.values,
      });
      continue;
    }

    const earlier = firstSeen.get(row.dedupeKey);
    if (earlier !== undefined) {
      duplicateInFile++;
      issues.push({
        rowNumber: row.rowNumber,
        code: "duplicate_in_file",
        message: `Duplicate key: same as row ${earlier} in this file. Row would be skipped.`,
        values: row.values,
      });
    } else {
      importable++;
      firstSeen.set(row.dedupeKey, row.rowNumber);
    }
  }

  issues.sort((a, b) => a.rowNumber - b.rowNumber);
  return {
    totalRows: rows.length,
    importableRows: importable,
    invalidRows: invalid.length,
    duplicateInFileRows: duplicateInFile,
    duplicateExistingRows: duplicateExisting,
    issues: issues.slice(0, limits.issueLimit),
    issuesTruncated: issues.length > limits.issueLimit,
    sample: valid.slice(0, limits.sampleRows).map((row) => row.payload),
  };
}
