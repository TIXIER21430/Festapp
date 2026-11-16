// Read-only preview before exporting personally identifying contact fields.
// This helper does not access storage or trigger downloads.
import { EXPORT_COLUMNS } from "./moduleCsv.js";

const CONTACT_FIELDS = Object.freeze(["nom", "prenom", "contact", "email", "telephone"]);

export function inspectCsvPrivacy(moduleName, records) {
  if (!Object.hasOwn(EXPORT_COLUMNS, moduleName)) throw new RangeError("Unknown export module");
  if (!Array.isArray(records)) throw new TypeError("Records must be an array");
  const fields = EXPORT_COLUMNS[moduleName].filter(field => CONTACT_FIELDS.includes(field));
  let populatedContacts = 0;
  for (const record of records) {
    if (!record || typeof record !== "object" || Array.isArray(record)) throw new TypeError("Invalid export record");
    if (fields.some(field => {
      const value = Object.hasOwn(record, field) ? record[field] : null;
      if (value == null) return false;
      if (typeof value !== "string") throw new TypeError("Invalid contact field");
      return value.trim().length > 0;
    })) populatedContacts++;
  }
  return Object.freeze({
    moduleName,
    rowCount: records.length,
    contactFields: Object.freeze([...fields]),
    populatedContacts,
    requiresPrivateHandling: populatedContacts > 0
  });
}
