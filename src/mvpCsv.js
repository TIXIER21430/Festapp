// Pure CSV exporter for FEST'APP's six MVP collections. No network or storage access.
// Spreadsheet formula escaping is deliberately applied before RFC 4180 quoting.
export const MVP_CSV_COLUMNS = Object.freeze({
  manifestations: ['id', 'nom', 'date', 'lieu'],
  taches: ['id', 'manifestation_id', 'titre', 'responsable', 'echeance', 'terminee'],
  benevoles: ['id', 'nom', 'prenom', 'email', 'telephone'],
  exposants: ['id', 'nom', 'contact', 'email', 'telephone'],
  groupes: ['id', 'nom', 'contact', 'email', 'telephone'],
  ecocups: ['id', 'date', 'type', 'quantite', 'manifestation_id'],
});

const FORMULA_PREFIX = /^[\\s\\u0000-\\u001f]*[=+@-]/u;
function safeCell(value) {
  if (value == null) return '';
  const text = typeof value === 'string' ? value : String(value);
  // Prefix dangerous cells with an apostrophe; preserve original data in memory.
  const protectedText = FORMULA_PREFIX.test(text) ? "'" + text : text;
  return '"' + protectedText.replaceAll('"', '""') + '"';
}
export function exportMvpCsv(collection, rows, { separator = ';' } = {}) {
  const columns = MVP_CSV_COLUMNS[collection];
  if (!columns) throw new Error('Collection CSV inconnue');
  if (!Array.isArray(rows)) throw new TypeError('Les fiches doivent être un tableau');
  if (separator !== ';' && separator !== ',') throw new Error('Séparateur CSV invalide');
  const lines = [columns.map(safeCell).join(separator)];
  for (const row of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new TypeError('Fiche CSV invalide');
    lines.push(columns.map((key) => safeCell(row[key])).join(separator));
  }
  return '\\uFEFF' + lines.join('\\r\\n') + '\\r\\n';
}
