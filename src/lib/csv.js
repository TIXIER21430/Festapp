// CSV export for FEST'APP. Pure functions: no storage, network or personal-data logging.
// Prefix spreadsheet formulas to prevent CSV injection when a file is opened in Excel.
export function escapeCsvCell(value) {
  const raw = String(value ?? "");
  // Invisible Unicode format marks and bidi controls may precede a spreadsheet formula.
  const dangerous = /^[\s\uFEFF\u00AD\u034F\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069]*[=+\-@\t\r\n]/u.test(raw);
  const safe = dangerous ? "'" + raw : raw;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export function buildCsv(headers, records) {
  if (!Array.isArray(headers) || !Array.isArray(records)) {
    throw new TypeError("CSV headers and records must be arrays");
  }
  const width = headers.length;
  const lines = [headers, ...records].map(row => {
    if (!Array.isArray(row) || row.length !== width) {
      throw new RangeError("CSV row width differs from header width");
    }
    return row.map(escapeCsvCell).join(";");
  });
  return "\uFEFF" + lines.join("\r\n");
}
