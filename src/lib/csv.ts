/**
 * Minimal RFC-4180-ish CSV parser. Handles quoted fields, escaped quotes
 * ("") and commas/newlines inside quotes. Returns one object per data row,
 * keyed by lowercased, trimmed header names.
 */
export function parseCsv(input: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  const text = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  // Flush trailing field/row.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return [];
  const headers = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const out: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r] ?? [];
    if (cells.every((c) => c.trim() === "")) continue; // skip blank lines
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (cells[idx] ?? "").trim();
    });
    out.push(obj);
  }
  return out;
}
