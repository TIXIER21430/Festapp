/** Safe semicolon-separated CSV for spreadsheet software. Pure, testable, no browser APIs. */
export function csvCell(value) {
  const raw = String(value ?? "");
  // Spreadsheet programs may execute cells starting with these characters.
  // Prefix a tab inside the quoted field to force text interpretation.
  const safe = /^[\s\u0000-\u001f]*[=+@-]/u.test(raw) ? "\t" + raw : raw;
  return '"' + safe.replaceAll('"', '""') + '"';
}
export function csvDocument(headers, records) {
  if (!Array.isArray(headers) || !Array.isArray(records)) throw new TypeError("CSV rows must be arrays");
  const width = headers.length;
  const lines = [headers, ...records].map(row => {
    if (!Array.isArray(row) || row.length !== width) throw new TypeError("CSV row width mismatch");
    return row.map(csvCell).join(";");
  });
  return "\uFEFF" + lines.join("\r\n");
}
