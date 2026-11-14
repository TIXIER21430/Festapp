// Offline-only reconciliation of counted ecocups against recorded movements.
// Produces a proposed adjustment; never writes to shared inventory.
import {summarizeEcocups} from "./ecocupDemoBalance.js";

export function reconcileEcocupCount(movements, {openingBalance=0,alertThreshold=0,countedQuantity,reason}={}) {
  if (!Number.isSafeInteger(countedQuantity) || countedQuantity < 0)
    throw new TypeError("Invalid physical count");
  if (typeof reason !== "string" || !reason.trim())
    throw new TypeError("A reason is required for reconciliation");
  const summary = summarizeEcocups(movements,{openingBalance,alertThreshold});
  const difference = countedQuantity - summary.balance;
  if (!Number.isSafeInteger(difference))
    throw new RangeError("Adjustment exceeds safe integer range");
  const proposedAdjustment = difference === 0 ? null : Object.freeze({
    kind: difference > 0 ? "entrée" : "sortie",
    quantity: Math.abs(difference),
    reason: reason.trim(),
    status: "pending-approval"
  });
  return {recordedQuantity:summary.balance,countedQuantity,difference,proposedAdjustment};
}
