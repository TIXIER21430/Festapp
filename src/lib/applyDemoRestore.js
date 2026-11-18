// Pure offline restore operation. Never writes browser storage or Supabase.
// Call only after an explicit user confirmation and a verified preview.
import { planDemoRestore } from "./demoRestorePlan.js";
import { validateDemoData } from "./demoBackup.js";

export function applyDemoRestore(currentData, backupJson, { confirmed = false } = {}) {
  if (confirmed !== true) throw new Error("Explicit restore confirmation required");
  const plan = planDemoRestore(currentData, backupJson);
  if (plan.danglingLinks.length) throw new Error("Restore blocked: linked manifestation missing");
  if (plan.conflicts.length) throw new Error("Restore blocked: duplicate record identifiers");
  if (plan.capacityExceeded.length) throw new Error("Restore blocked: category capacity exceeded");
  const result = validateDemoData(currentData);
  for (const [category, rows] of Object.entries(plan.additions)) {
    result[category] = [...(result[category] || []), ...rows.map(row => ({
      ...row, values: [...row.values]
    }))];
  }
  return result;
}
