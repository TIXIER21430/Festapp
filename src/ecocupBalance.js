// Calcul en lecture seule pour la démonstration locale ; aucune écriture Supabase.
export function ecocupBalance(records, initialStock = 0, alertThreshold = 100) {
  if (!Number.isSafeInteger(initialStock) || initialStock < 0 ||
      !Number.isSafeInteger(alertThreshold) || alertThreshold < 0) {
    return { ok: false, error: "Stock initial ou seuil invalide" };
  }
  let balance = initialStock;
  const seen = new Set();
  for (const record of records) {
    if (!record || typeof record.id !== "string" || seen.has(record.id) ||
        !Array.isArray(record.values)) {
      return { ok: false, error: "Mouvement absent, doublonné ou incomplet" };
    }
    seen.add(record.id);
    const [kind, raw] = record.values;
    if (!["Entrée", "Sortie"].includes(kind) || !/^[1-9]\\d*$/.test(String(raw ?? ""))) {
      return { ok: false, error: "Mouvement ou quantité invalide" };
    }
    const quantity = Number(raw);
    if (!Number.isSafeInteger(quantity)) return { ok: false, error: "Quantité trop élevée" };
    balance += kind === "Entrée" ? quantity : -quantity;
    if (!Number.isSafeInteger(balance) || balance < 0) {
      return { ok: false, error: "Historique incohérent : stock négatif ou débordement" };
    }
  }
  return { ok: true, balance, threshold: alertThreshold, alert: balance <= alertThreshold };
}
