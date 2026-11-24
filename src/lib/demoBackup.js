import {readLoan} from './equipmentLoans.js';
import {validSupplier} from './shoppingSuppliers.js';
// Offline demo backup format. Never import automatically into shared production data.
export const DEMO_BACKUP_FORMAT = "festapp-demo-backup";
export const DEMO_BACKUP_VERSION = 1;
const allowed = new Set(["events","tasks","shopping","stock","ecocups","contacts","shifts","feedback","recipes","finance","equipment","equipmentLoans","posts","archives"]);
const own = (obj,key) => Object.prototype.hasOwnProperty.call(obj,key);
export function validateDemoData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new TypeError("Invalid demo data");
  const result = {};
  for (const [category,rows] of Object.entries(data)) {
    if (!allowed.has(category) || !Array.isArray(rows) || rows.length > 10000) throw new TypeError("Invalid category");
    const ids = new Set();
    result[category] = rows.map(row => {
      if (!row || typeof row !== "object" || typeof row.id !== "string" || !row.id || ids.has(row.id) ||
          !Array.isArray(row.values) || row.values.length !== 3 ||
          row.values.some(value => typeof value !== "string" || value.length > 20000)) {
        throw new TypeError("Invalid demo record");
      }
      ids.add(row.id);
      if(category==='equipmentLoans')readLoan(row);
      if (own(row,"eventId") && (typeof row.eventId !== "string" || row.eventId.length > 200)) throw new TypeError("Invalid event link");
      if (own(row,"done") && (category !== "tasks" || typeof row.done !== "boolean")) throw new TypeError("Invalid task completion");
      if (own(row,"phase") && (category !== "tasks" || typeof row.phase !== "string" || row.phase.length > 200)) throw new TypeError("Invalid task phase");
      if (own(row,"email") && (category !== "contacts" || typeof row.email !== "string" || row.email.length > 320)) throw new TypeError("Invalid contact email");
      if (own(row,"phone") && (category !== "contacts" || typeof row.phone !== "string" || row.phone.length > 64)) throw new TypeError("Invalid contact phone");
      if (own(row,"supplier") && (category !== "shopping" || !validSupplier(row.supplier))) throw new TypeError("Invalid purchase supplier");
      return {...(own(row,"supplier")?{supplier:row.supplier}:{}),...(own(row,"eventId")?{eventId:row.eventId}:{}),...(own(row,"done")?{done:row.done}:{}),...(own(row,"phase")?{phase:row.phase}:{}),...(own(row,"email")?{email:row.email}:{}),...(own(row,"phone")?{phone:row.phone}:{}),id:row.id,values:[...row.values]};
    });
  }
  return result;
}
export function createDemoBackup(data, timestamp = new Date().toISOString()) {
  const validated = validateDemoData(data);
  if (typeof timestamp !== "string" || !Number.isFinite(Date.parse(timestamp))) throw new TypeError("Invalid timestamp");
  const json = JSON.stringify({format:DEMO_BACKUP_FORMAT,version:DEMO_BACKUP_VERSION,exportedAt:timestamp,data:validated},null,2);
  // Match the importer limit: never offer a backup that this app cannot restore.
  if (new TextEncoder().encode(json).byteLength > 10_000_000) throw new RangeError("Backup too large to restore");
  return json;
}
export function parseDemoBackup(json) {
  if (typeof json !== "string" || new TextEncoder().encode(json).byteLength > 10_000_000) throw new TypeError("Backup too large or invalid");
  const parsed = JSON.parse(json);
  if (!parsed || parsed.format !== DEMO_BACKUP_FORMAT || parsed.version !== DEMO_BACKUP_VERSION ||
      typeof parsed.exportedAt !== "string" || !Number.isFinite(Date.parse(parsed.exportedAt)) ||
      !own(parsed,"data")) throw new TypeError("Unsupported backup format");
  return validateDemoData(parsed.data);
}
export function previewDemoBackup(json) {
  const data = parseDemoBackup(json);
  return {categories:Object.keys(data).length,records:Object.values(data).reduce((n,rows)=>n+rows.length,0),data};
}
