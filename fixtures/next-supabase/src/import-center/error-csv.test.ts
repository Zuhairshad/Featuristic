import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";
import { buildErrorCsv, csvCell } from "./error-csv";

describe("csvCell", () => {
  it("quotes cells containing delimiters, quotes, or newlines", () => {
    expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"');
    expect(csvCell("plain")).toBe("plain");
  });

  it.each(["=SUM(A1)", "+1", "-1", "@cmd", "\tx"])("neutralizes formula prefix in %j", (value) => {
    expect(csvCell(value).replace(/^"/, "").startsWith("'")).toBe(true);
  });
});

describe("buildErrorCsv", () => {
  it("round-trips through the CSV parser with original values preserved as JSON", () => {
    const text = buildErrorCsv([
      { row_number: 2, code: "missing_key", message: 'Key column "Email" is empty.', row_values: { Email: "", Name: "Ann, B." } },
      { row_number: 7, code: "duplicate_existing", message: "Duplicate key", row_values: { Email: "=HYPERLINK()" } },
    ]);
    const parsed = parseCsv(text);
    expect(parsed.headers).toEqual(["data_row_number", "error_code", "error_message", "row_values"]);
    expect(parsed.rows[0]?.slice(0, 3)).toEqual(["2", "missing_key", 'Key column "Email" is empty.']);
    expect(JSON.parse(parsed.rows[0]?.[3] ?? "")).toEqual({ Email: "", Name: "Ann, B." });
    expect(parsed.rows[1]?.[3]).toContain("=HYPERLINK()");
  });

  it("emits only the header when there are no errors", () => {
    expect(buildErrorCsv([])).toBe("data_row_number,error_code,error_message,row_values\r\n");
  });
});
