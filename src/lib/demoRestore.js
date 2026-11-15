// Explicit, non-destructive DEMO restore planning. Never writes to storage or Supabase.
import {parseDemoBackup,validateDemoData} from "./demoBackup.js";

export function planDemoRestore(current, backupJson) {
  const existing = validateDemoData(current);
  const incoming = parseDemoBackup(backupJson);
  const merged = structuredClone(existing);
  const conflicts = [];
  let added = 0;
  for (const [category, rows] of Object.entries(incoming)) {
    const destination = merged[category] ?? (merged[category] = []);
    const byId = new Map(destination.map(row => [row.id, row]));
    for (const row of rows) {
      const prior = byId.get(row.id);
      if (prior) {
        if (JSON.stringify(prior.values) !== JSON.stringify(row.values)) conflicts.push({category,id:row.id});
        continue; // Existing demo records always win. Never silently overwrite.
      }
      destination.push({id:row.id,values:[...row.values]});
      byId.set(row.id,row);
      added++;
    }
  }
  // Keep the preview within the same per-category limit as demo backups. 
  // Reject the entire preview instead of returning an unusable partial merge. 
  validateDemoData(merged); 
  return {data:merged,added,conflicts,requiresConfirmation:true};
}
