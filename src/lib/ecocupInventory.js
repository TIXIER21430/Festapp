/**
 * Pure Ecocup ledger for a future durable store. No browser storage, database
 * writes or automatic stock corrections. All quantities are whole cups.
 */
const kinds = new Set(['purchase', 'return', 'checkout', 'loss', 'adjustment']);
function integer(value, label) {
  if (!Number.isSafeInteger(value)) throw new TypeError(label + ' must be a safe integer');
  return value;
}
export function summarizeEcocups({ opening = 0, threshold = 0, movements = [] } = {}) {
  integer(opening, 'opening');
  integer(threshold, 'threshold');
  if (opening < 0 || threshold < 0) throw new RangeError('Negative opening or threshold');
  if (!Array.isArray(movements)) throw new TypeError('movements must be an array');
  const ids = new Set();
  let available = opening;
  for (const movement of movements) {
    if (!movement || typeof movement.id !== 'string' || !movement.id.trim() || ids.has(movement.id.trim().normalize('NFC'))) {
      throw new Error('Missing or duplicate movement ID');
    }
    ids.add(movement.id.trim().normalize('NFC'));
    if (!kinds.has(movement.kind)) throw new Error('Unknown movement kind');
    const quantity = integer(movement.quantity, 'quantity');
    if (movement.kind === 'adjustment') {
      if (!movement.reason || typeof movement.reason !== 'string' || !movement.reason.trim()) {
        throw new Error('Adjustment requires a reason');
      }
    } else if (quantity <= 0) {
      throw new RangeError('Movement quantity must be positive');
    }
    const delta = movement.kind === 'checkout' || movement.kind === 'loss' ? -quantity : quantity;
    const next = available + delta;
    if (!Number.isSafeInteger(next) || next < 0) throw new RangeError('Invalid or insufficient Ecocup balance');
    available = next;
  }
  return { available, threshold, lowStock: available <= threshold, movementCount: movements.length };
}
