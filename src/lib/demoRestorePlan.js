// Offline-only restore preview: no storage, network or database writes.
// The caller must explicitly decide what to do with the returned plan.
import { parseDemoBackup, validateDemoData } from "./demoBackup.js";

export function planDemoRestore(currentData, backupJson) {
  const current = validateDemoData(currentData);
  const incoming = parseDemoBackup(backupJson);
  const conflicts = [];
  const additions = {};
  const counts = {};
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
    counts[category] = {
      incoming: rows.length,
      addable: additions[category].length,
      conflicts: rows.length - additions[category].length
    };
  }
  return { counts, conflicts, additions, safeToAppend: conflicts.length === 0 };
}
