// Pure offline-demo calculator. This is NOT the authoritative shared inventory.
// A real shared stock must be changed atomically on the server after authorization.
export function summarizeEcocups(movements, {openingBalance = 0, alertThreshold = 0} = {}) {
  if (!Number.isSafeInteger(openingBalance) || openingBalance < 0 ||
      !Number.isSafeInteger(alertThreshold) || alertThreshold < 0 ||
      !Array.isArray(movements)) throw new TypeError("Invalid ecocup configuration");
  let balance = openingBalance;
  const seen = new Set();
  const history = [];
  for (const row of movements) {
    if (!row || typeof row.id !== "string" || !row.id || seen.has(row.id) ||
        !Array.isArray(row.values) || row.values.length !== 3) throw new TypeError("Invalid ecocup movement");
    seen.add(row.id);
    const [kind, quantityText, event] = row.values;
    if (!["entrée", "sortie"].includes(kind) || typeof quantityText !== "string" ||
        !/^[1-9][0-9]*$/.test(quantityText) || typeof event !== "string") {
      throw new TypeError("Invalid ecocup movement");
    }
    const quantity = Number(quantityText);
    if (!Number.isSafeInteger(quantity)) throw new TypeError("Invalid quantity");
    const next = kind === "entrée" ? balance + quantity : balance - quantity;
    if (!Number.isSafeInteger(next) || next < 0) throw new RangeError("Insufficient ecocup stock");
    balance = next;
    history.push({id:row.id,kind,quantity,event,balance});
  }
  // Quantity needed to move strictly above the warning threshold. Null means
  // the configured threshold is already the largest safe integer.
  const alert = balance <= alertThreshold;
  const minimumToClearAlert = !alert ? 0 : alertThreshold === Number.MAX_SAFE_INTEGER
    ? null : alertThreshold - balance + 1;
  return {balance,alert,minimumToClearAlert,history};
}
