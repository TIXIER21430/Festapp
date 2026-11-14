// Stable, explicit CSV columns for the MVP. No network or storage access.
// Export only data intentionally selected by an authorized UI caller.
import { buildCsv } from "./csv.js";

export const EXPORT_COLUMNS = Object.freeze({
  manifestations: ["id", "nom", "date", "lieu", "statut"],
  taches: ["id", "manifestation_id", "titre", "responsable_id", "echeance", "terminee"],
  benevoles: ["id", "nom", "prenom", "email", "telephone"],
  exposants: ["id", "nom", "contact", "email", "telephone"],
  groupes: ["id", "nom", "contact", "email", "telephone"],
  ecocups: ["id", "date", "type", "quantite", "manifestation_id"]
});

function scalar(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  throw new TypeError("CSV export refuses non-scalar or non-finite values");
}

export function exportModuleCsv(moduleName, records) {
  if (!Object.hasOwn(EXPORT_COLUMNS, moduleName)) throw new RangeError("Unknown export module");
  if (!Array.isArray(records)) throw new TypeError("Records must be an array");
  const columns = EXPORT_COLUMNS[moduleName];
  const rows = records.map(record => {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      throw new TypeError("Invalid export record");
    }
    return columns.map(column => scalar(Object.hasOwn(record, column) ? record[column] : ""));
  });
  return buildCsv(columns, rows);
}
