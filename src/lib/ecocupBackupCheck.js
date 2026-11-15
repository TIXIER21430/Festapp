import {parseDemoBackup} from "./demoBackup.js";
import {summarizeEcocups} from "./ecocupDemoBalance.js";

// Read-only inspection. Never restores, imports or changes any inventory.
export function inspectEcocupBackup(json, settings) {
  const data = parseDemoBackup(json);
  const movements = data.ecocups ?? [];
  try {
    const summary = summarizeEcocups(movements, settings);
    return {valid:true, movementCount:movements.length, balance:summary.balance,
      alert:summary.alert, minimumToClearAlert:summary.minimumToClearAlert};
  } catch (error) {
    return {valid:false, movementCount:movements.length,
      reason:error instanceof RangeError ? "negative-or-overflow-stock" : "invalid-movement-or-settings"};
  }
}
