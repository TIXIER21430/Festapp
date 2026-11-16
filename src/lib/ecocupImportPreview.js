// Pure, read-only preview for ecocup movement imports. No network or storage writes.
// A preview must never be treated as an authorization to restore real data.
const TYPES = new Set(['achat', 'sortie', 'retour', 'perte', 'correction']);
const MAX_ROWS = 10000;
export function previewEcocupImport(rows, { existingIds = [], initialStock = 0, threshold = 100 } = {}) {
  if (!Array.isArray(rows) || rows.length > MAX_ROWS) throw new TypeError('Invalid movement list');
  if (!Number.isSafeInteger(initialStock) || initialStock < 0) throw new TypeError('Invalid initial stock');
  if (!Number.isSafeInteger(threshold) || threshold < 0) throw new TypeError('Invalid threshold');
  if (!Array.isArray(existingIds) || existingIds.some(id => typeof id !== 'string' || !id.trim())) throw new TypeError('Invalid existing movement IDs');
  const seen = new Set(existingIds.map(id => id.trim()));
  const errors = [];
  let stock = initialStock;
  const deltas = { achat: 0, sortie: 0, retour: 0, perte: 0, correction: 0 };
  for (const [index, row] of rows.entries()) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) { errors.push({ index, reason: 'invalid-row' }); continue; }
    const { id, type, quantity } = row;
    if (typeof id !== 'string' || !id.trim() || seen.has(id.trim())) { errors.push({ index, reason: 'duplicate-or-missing-id' }); continue; }
    seen.add(id.trim());
    if (!TYPES.has(type) || !Number.isSafeInteger(quantity) || quantity <= 0) { errors.push({ index, reason: 'invalid-movement' }); continue; }
    // Corrections require an explicitly signed delta; quantity remains positive for other types.
    if (type === 'correction') { errors.push({ index, reason: 'correction-requires-manual-review' }); continue; }
    const delta = type === 'achat' || type === 'retour' ? quantity : -quantity;
    if (!Number.isSafeInteger(stock + delta) || stock + delta < 0) { errors.push({ index, reason: 'negative-or-overflow-stock' }); continue; }
    // Keep aggregate exports exact even when the running stock remains within bounds.
    if (!Number.isSafeInteger(deltas[type] + delta)) { errors.push({ index, reason: 'movement-total-overflow' }); continue; }
    stock += delta;
    deltas[type] += delta;
  }
  return {
    accepted: errors.length === 0,
    count: rows.length,
    projectedStock: errors.length ? null : stock,
    lowStock: errors.length ? null : stock <= threshold,
    deltas: errors.length ? null : deltas,
    errors
  };
}
