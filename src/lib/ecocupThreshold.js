/** Pure ecocup alert helpers. No network, storage or production writes. */
export function validateEcocupThreshold(value) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError('Le seuil doit être un entier positif ou nul');
  }
  return value;
}

export function ecocupStockStatus(stock, threshold) {
  if (!Number.isSafeInteger(stock) || stock < 0) {
    throw new RangeError('Le stock doit être un entier positif ou nul');
  }
  validateEcocupThreshold(threshold);
  return Object.freeze({
    stock,
    threshold,
    alert: stock <= threshold,
    shortage: Math.max(0, threshold - stock),
  });
}
