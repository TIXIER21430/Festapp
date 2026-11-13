// Utilitaires de validation sans dépendance au navigateur.
export function parseAmount(value) {
  const v = String(value ?? "").trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(v)) return null;
  const n = Number(v);
  return Number.isSafeInteger(Math.round(n * 100)) ? n : null;
}

export function financeNature(value) {
  const v = String(value ?? "").trim().toLowerCase();
  return v === "recette" ? "Recette" : v === "dépense" || v === "depense" ? "Dépense" : null;
}

export function eventDate(value) {
  const text = String(value ?? "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return d.getFullYear() === Number(match[1])
    && d.getMonth() === Number(match[2]) - 1
    && d.getDate() === Number(match[3]) ? d : null;
}
