// Pure, offline-only restore helper. Does not write to localStorage or Supabase.
// A restore is all-or-nothing: conflicting identifiers reject the entire import.
import {validateDemoData} from "./demoBackup.js";
import {planDemoRestore} from "./demoRestorePlan.js";

export function mergeDemoBackupWithoutOverwrite(currentData, backupJson) {
  const current = validateDemoData(currentData);
  const plan = planDemoRestore(current, backupJson);
  if (!plan.safeToAppend) {
    const error = new Error("Restore blocked: existing identifiers would be overwritten");
    error.code = "DEMO_RESTORE_CONFLICT";
    error.conflicts = plan.conflicts;
    throw error;
  }
  const result = {...current};
  for (const [category, additions] of Object.entries(plan.additions)) {
    result[category] = [...(result[category] || []), ...additions.map(row => ({id:row.id, values:[...row.values]}))];
  }
  return validateDemoData(result);
}
