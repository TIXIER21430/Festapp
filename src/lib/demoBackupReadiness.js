// Read-only readiness check for a DEMO backup. Never writes or uploads data.
import { parseDemoBackup } from "./demoBackup.js";

const REQUIRED = ["events", "tasks", "contacts", "ecocups"];
export function inspectDemoBackupReadiness(json) {
  const data = parseDemoBackup(json);
  const missingCategories = REQUIRED.filter(name => !Object.hasOwn(data, name));
  const counts = Object.fromEntries(Object.entries(data).map(([name, rows]) => [name, rows.length]));
  const emptyCategories = REQUIRED.filter(name => Object.hasOwn(data, name) && data[name].length === 0);
  return {
    kind: "offline-demo-only",
    counts,
    missingCategories,
    emptyCategories,
    recordCount: Object.values(data).reduce((sum, rows) => sum + rows.length, 0),
    hasContactData: (counts.contacts ?? 0) > 0,
    canRestoreToSharedDatabase: false,
    requiresHumanReview: true,
  };
}
