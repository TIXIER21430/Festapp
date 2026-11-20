// Offline-only restore preview: no storage, network or database writes.
// The caller must explicitly decide what to do with the returned plan.
import { parseDemoBackup, validateDemoData } from "./demoBackup.js";

// Keep the optional checklist metadata during preview and restoration.
// Revalidating at the boundary also returns detached records and value arrays.
const copyRecord = row => ({...row, values:[...row.values]});

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
        additions[category].push(copyRecord(row));
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
  // A linked record must never be added with a reference to a missing event.
  // Check additions only: pre-existing legacy orphans are preserved untouched.
  const eventIds = new Set([...(current.events || []), ...(additions.events || [])].map(row => row.id));
  const equipmentIds = new Set([...(current.equipment || []), ...(additions.equipment || [])].map(row => row.id));
  const danglingLinks = [];
  for (const [category, rows] of Object.entries(additions)) {
    if (category === "events") continue;
    for (const row of rows) {
      if (category === 'equipmentLoans' && !equipmentIds.has(row.values[0])) {
        danglingLinks.push({category, id:row.id, equipmentId:row.values[0]});
      }
      if (row.eventId && !eventIds.has(row.eventId)) {
        danglingLinks.push({category, id:row.id, eventId:row.eventId});
      }
    }
  }
  return { counts, conflicts, capacityExceeded, danglingLinks, additions,
    safeToAppend: conflicts.length === 0 && capacityExceeded.length === 0 && danglingLinks.length === 0 };
}
