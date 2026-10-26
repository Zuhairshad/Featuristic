export type ErrorCsvRow = {
  row_number: number;
  code: string;
  message: string;
  row_values: Record<string, string>;
};

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/** Quotes a cell and neutralizes spreadsheet formula injection (values originate from user uploads). */
export function csvCell(value: string): string {
  const safe = FORMULA_PREFIX.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Builds the downloadable row-error file: one line per rejected row, original values as JSON. */
export function buildErrorCsv(errors: ErrorCsvRow[]): string {
  const lines = [["row_number", "error_code", "error_message", "row_values"].join(",")];
  for (const error of errors) {
    lines.push(
      [
        String(error.row_number),
        csvCell(error.code),
        csvCell(error.message),
        csvCell(JSON.stringify(error.row_values)),
      ].join(","),
    );
  }
  return `${lines.join("\r\n")}\r\n`;
}
