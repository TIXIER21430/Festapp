// Pure, read-only preview for an offline demonstration backup.
// Never sends or restores personal data automatically.
import { parseDemoBackup } from "./demoBackup.js";

export function summarizeDemoBackup(json) {
  const data = parseDemoBackup(json);
  const categories = Object.entries(data).map(([name, rows]) => ({
    name,
    count: rows.length,
  }));
  return {
    categories,
    totalRecords: categories.reduce((sum, item) => sum + item.count, 0),
    containsContacts: (data.contacts?.length ?? 0) > 0,
    restoreRequiresExplicitApproval: true,
    sharedDatabaseCompatible: false,
  };
}
