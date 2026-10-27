import { describe, expect, it } from "vitest";
import { CsvFormatError, parseCsv } from "./csv";

function formatError(run: () => unknown): CsvFormatError {
  try {
    run();
  } catch (error) {
    if (error instanceof CsvFormatError) return error;
    throw error;
  }
  throw new Error("expected CsvFormatError");
}

describe("parseCsv", () => {
  it("parses headers and data rows, handling BOM, quotes, and blank lines", () => {
    const parsed = parseCsv('﻿Email, Name \n"a@example.test","Doe, Jane"\n\nb@example.test,Bob\n');
    expect(parsed.headers).toEqual(["Email", "Name"]);
    expect(parsed.rows).toEqual([
      ["a@example.test", "Doe, Jane"],
      ["b@example.test", "Bob"],
    ]);
  });

  it("keeps ragged rows so validation can report them per row", () => {
    const parsed = parseCsv("a,b\n1\n1,2,3\n1,2\n");
    expect(parsed.rows.map((row) => row.length)).toEqual([1, 3, 2]);
  });

  it.each([
    ["", "empty_file"],
    ["a,b\n", "no_data_rows"],
    ["a,,c\n1,2,3\n", "empty_header"],
    ["a,A\n1,2\n", "duplicate_header"],
    ['a,b\n"unterminated,2\n', "malformed_csv"],
  ])("rejects %j with %s", (input, code) => {
    expect(formatError(() => parseCsv(input)).code).toBe(code);
  });

  it("does not echo file contents in malformed-file messages", () => {
    const error = formatError(() => parseCsv('a,b\n"secret-value,2\n'));
    expect(error.message).not.toContain("secret-value");
  });

  it("enforces row and size limits", () => {
    const manyRows = `a\n${Array.from({ length: 10_001 }, (_, i) => String(i)).join("\n")}\n`;
    expect(formatError(() => parseCsv(manyRows)).code).toBe("too_many_rows");
    expect(formatError(() => parseCsv(`a\n${"x".repeat(5 * 1024 * 1024)}\n`)).code).toBe("file_too_large");
  });
});
