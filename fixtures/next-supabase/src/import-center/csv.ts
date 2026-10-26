import { parse } from "csv-parse/sync";
import { IMPORT_LIMITS } from "./limits";

export type CsvFormatErrorCode =
  | "file_too_large"
  | "malformed_csv"
  | "empty_file"
  | "no_data_rows"
  | "too_many_rows"
  | "too_many_columns"
  | "empty_header"
  | "duplicate_header";

/** A whole-file problem. Messages are safe to show: they never echo file contents. */
export class CsvFormatError extends Error {
  readonly code: CsvFormatErrorCode;

  constructor(code: CsvFormatErrorCode, message: string) {
    super(message);
    this.name = "CsvFormatError";
    this.code = code;
  }
}

export type ParsedCsv = {
  headers: string[];
  /** Data rows only (header excluded). Rows may be ragged; validation reports that per row. */
  rows: string[][];
};

/**
 * Parses CSV text. The header is the first non-empty record. Row numbers used elsewhere are
 * 1-based indexes into `rows`, so row 1 is the first line after the header.
 */
export function parseCsv(text: string): ParsedCsv {
  if (Buffer.byteLength(text, "utf8") > IMPORT_LIMITS.maxFileBytes) {
    throw new CsvFormatError("file_too_large", "The file is larger than the 5 MB limit.");
  }

  let records: string[][];
  try {
    records = parse(text, {
      bom: true,
      skip_empty_lines: true,
      relax_column_count: true,
      max_record_size: IMPORT_LIMITS.maxCellLength * IMPORT_LIMITS.maxColumns,
    }) as string[][];
  } catch (error) {
    const line = (error as { lines?: number }).lines;
    throw new CsvFormatError(
      "malformed_csv",
      line ? `The file is not valid CSV (problem near line ${line}).` : "The file is not valid CSV.",
    );
  }

  const [headerRecord, ...rows] = records;
  if (!headerRecord) {
    throw new CsvFormatError("empty_file", "The file is empty.");
  }
  if (headerRecord.length > IMPORT_LIMITS.maxColumns) {
    throw new CsvFormatError("too_many_columns", `The file has more than ${IMPORT_LIMITS.maxColumns} columns.`);
  }

  const headers = headerRecord.map((header) => header.trim());
  assertValidHeaders(headers);

  if (rows.length === 0) {
    throw new CsvFormatError("no_data_rows", "The file has a header but no data rows.");
  }
  if (rows.length > IMPORT_LIMITS.maxRows) {
    throw new CsvFormatError("too_many_rows", `The file has more than ${IMPORT_LIMITS.maxRows} data rows.`);
  }

  return { headers, rows };
}

export function assertValidHeaders(headers: string[]): void {
  const seen = new Set<string>();
  for (const [index, header] of headers.entries()) {
    if (header === "") {
      throw new CsvFormatError("empty_header", `Column ${index + 1} has an empty header.`);
    }
    const folded = header.toLowerCase();
    if (seen.has(folded)) {
      throw new CsvFormatError("duplicate_header", `The header "${header}" appears more than once.`);
    }
    seen.add(folded);
  }
}
