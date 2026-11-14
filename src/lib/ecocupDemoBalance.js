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
  return {balance,alert:balance <= alertThreshold,history};
}
