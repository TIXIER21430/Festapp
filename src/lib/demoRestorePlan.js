// Offline-only restore preview: no storage, network or database writes.
// The caller must explicitly decide what to do with the returned plan.
import { parseDemoBackup, validateDemoData } from "./demoBackup.js";

export function planDemoRestore(currentData, backupJson) {
  const current = validateDemoData(currentData);
  const incoming = parseDemoBackup(backupJson);
  const conflicts = [];
  const additions = {};
  const counts = {};
  const capacityExceeded = [];
  for (const [category, rows] of Object.entries(incoming)) {
    const existingIds = new Set((current[category] || []).map(row => row.id));
    additions[category] = [];
    for (const row of rows) {
      if (existingIds.has(row.id)) {
        conflicts.push({ category, id: row.id });
      } else {
        additions[category].push({ id: row.id, values: [...row.values] });
      }
    }
    const finalCount = (current[category] || []).length + additions[category].length;
    if (finalCount > 10000) capacityExceeded.push({category, finalCount, maximum:10000});
    counts[category] = {
      incoming: rows.length,
      addable: additions[category].length,
      conflicts: rows.length - additions[category].length
    };
  }
  return { counts, conflicts, capacityExceeded, additions, safeToAppend: conflicts.length === 0 && capacityExceeded.length === 0 };
}
