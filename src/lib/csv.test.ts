import { describe, it, expect } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("parses a simple sheet with lowercased headers", () => {
    const rows = parseCsv("Name,Category\nLift #1,Lift\nCompressor,Air");
    expect(rows).toEqual([
      { name: "Lift #1", category: "Lift" },
      { name: "Compressor", category: "Air" },
    ]);
  });

  it("handles quoted fields with commas and escaped quotes", () => {
    const rows = parseCsv(
      'name,notes\n"Lift, Bay 3","He said ""ok"""\nPlain,none',
    );
    expect(rows[0]).toEqual({ name: "Lift, Bay 3", notes: 'He said "ok"' });
    expect(rows[1]).toEqual({ name: "Plain", notes: "none" });
  });

  it("skips blank lines and handles CRLF", () => {
    const rows = parseCsv("name\r\nA\r\n\r\nB\r\n");
    expect(rows).toEqual([{ name: "A" }, { name: "B" }]);
  });

  it("returns empty array for empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });
});
