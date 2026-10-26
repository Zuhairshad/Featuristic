import { describe, expect, it } from "vitest";
import { buildDedupeKey, normalizeKeyPart, previewRows, suggestPayloadKey, validateMapping, validateRows } from "./validation";

const headers = ["Email", "Full Name", "Plan"];
const mapping = { Email: "email", "Full Name": "full_name", Plan: "plan" };

describe("suggestPayloadKey", () => {
  it("produces valid snake_case keys", () => {
    expect(suggestPayloadKey("Email Address")).toBe("email_address");
    expect(suggestPayloadKey("  Plan-Type! ")).toBe("plan_type");
    expect(suggestPayloadKey("1st value")).toBe("st_value");
  });
});

describe("validateMapping", () => {
  it("accepts a coherent mapping", () => {
    expect(validateMapping(headers, mapping, ["Email"])).toEqual([]);
  });

  it("reports unknown headers, bad field names, collisions, and key problems", () => {
    const problems = validateMapping(
      headers,
      { Email: "Bad Key", Nope: "x", "Full Name": "x" },
      ["Plan", "Plan"],
    );
    expect(problems.join("\n")).toMatch(/"Nope" is not in the file/);
    expect(problems.join("\n")).toMatch(/"Bad Key" is not a valid field name/);
    expect(problems.join("\n")).toMatch(/both map to "x"/);
    expect(problems.join("\n")).toMatch(/Key column "Plan" must also be mapped/);
    expect(problems.join("\n")).toMatch(/Key columns must be unique/);
  });

  it("requires at least one mapped column and one key column", () => {
    expect(validateMapping(headers, {}, [])).toEqual([
      "Map at least one column.",
      "Choose at least one key column for duplicate detection.",
    ]);
  });
});

describe("duplicate keys", () => {
  it("normalizes case, whitespace, and Unicode compatibility forms", () => {
    expect(normalizeKeyPart("  Jane   DOE ")).toBe("jane doe");
    expect(normalizeKeyPart("ＡＢＣ")).toBe("abc");
    expect(buildDedupeKey(["A@Example.test ", "x"])).toBe(buildDedupeKey(["a@example.TEST", " X "]));
  });

  it("keeps composite keys unambiguous", () => {
    expect(buildDedupeKey(["a", "b c"])).not.toBe(buildDedupeKey(["a b", "c"]));
  });
});

describe("validateRows", () => {
  it("returns every row exactly once as valid or invalid", () => {
    const rows = [
      ["a@example.test", "Ann", "pro"],
      ["", "No Email", "free"],
      ["short@example.test", "Short"],
      ["c@example.test", "Cy", "free", "extra"],
    ];
    const { valid, invalid } = validateRows(headers, rows, mapping, ["Email"]);
    expect(valid.map((row) => row.rowNumber)).toEqual([1]);
    expect(invalid.map((row) => [row.rowNumber, row.code])).toEqual([
      [2, "missing_key"],
      [3, "column_count_mismatch"],
      [4, "column_count_mismatch"],
    ]);
    expect(valid[0]?.payload).toEqual({ email: "a@example.test", full_name: "Ann", plan: "pro" });
  });

  it("only validates the requested slice but keeps global row numbers", () => {
    const rows = [["a@x.test", "A", "p"], ["", "B", "p"], ["c@x.test", "C", "p"]];
    const { valid, invalid } = validateRows(headers, rows, mapping, ["Email"], 1, 3);
    expect(valid.map((row) => row.rowNumber)).toEqual([3]);
    expect(invalid.map((row) => row.rowNumber)).toEqual([2]);
  });

  it("rejects over-long cells without storing the value", () => {
    const rows = [["a@x.test", "x".repeat(10_001), "p"]];
    const { invalid } = validateRows(headers, rows, mapping, ["Email"]);
    expect(invalid[0]).toMatchObject({ code: "value_too_long", values: {} });
  });

  it("treats a whitespace-only key as missing", () => {
    const { invalid } = validateRows(headers, [["   ", "A", "p"]], mapping, ["Email"]);
    expect(invalid[0]?.code).toBe("missing_key");
  });
});

describe("previewRows", () => {
  const rows = [
    ["a@example.test", "Ann", "pro"],
    ["A@EXAMPLE.TEST ", "Ann again", "pro"],
    ["old@example.test", "Old", "free"],
    ["", "Nobody", "free"],
    ["new@example.test", "New", "free"],
  ];

  it("counts importable, invalid, and both duplicate kinds and explains each", () => {
    const preview = previewRows(headers, rows, mapping, ["Email"], new Set([buildDedupeKey(["old@example.test"])]));
    expect(preview).toMatchObject({
      totalRows: 5,
      importableRows: 2,
      invalidRows: 1,
      duplicateInFileRows: 1,
      duplicateExistingRows: 1,
      issuesTruncated: false,
    });
    expect(preview.issues.map((issue) => [issue.rowNumber, issue.code])).toEqual([
      [2, "duplicate_in_file"],
      [3, "duplicate_existing"],
      [4, "missing_key"],
    ]);
    expect(preview.issues[0]?.message).toContain("same as row 1");
  });

  it("classifies every file row whose key is already stored as duplicate_existing, matching the database", () => {
    const stored = new Set([buildDedupeKey(["shared@example.test"])]);
    const sharedRows = [
      ["shared@example.test", "First", "pro"],
      ["SHARED@example.test", "Second", "pro"],
      ["fresh@example.test", "Fresh", "pro"],
      ["fresh@example.test", "Fresh again", "pro"],
    ];
    const preview = previewRows(headers, sharedRows, mapping, ["Email"], stored);
    expect(preview).toMatchObject({ importableRows: 1, duplicateExistingRows: 2, duplicateInFileRows: 1 });
    expect(preview.issues.map((issue) => [issue.rowNumber, issue.code])).toEqual([
      [1, "duplicate_existing"],
      [2, "duplicate_existing"],
      [4, "duplicate_in_file"],
    ]);
  });

  it("truncates the issue list but not the counts", () => {
    const many = Array.from({ length: 10 }, () => ["", "x", "y"]);
    const preview = previewRows(headers, many, mapping, ["Email"], new Set(), { issueLimit: 3, sampleRows: 1 });
    expect(preview.invalidRows).toBe(10);
    expect(preview.issues).toHaveLength(3);
    expect(preview.issuesTruncated).toBe(true);
  });
});
