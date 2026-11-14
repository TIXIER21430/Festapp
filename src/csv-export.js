// Pure CSV export helper: no storage or network side effects.
const escapeFormula = (value) => /^[\s\u0000-\u001f]*[=+@\-]/u.test(value) ? "'" + value : value;
const csvCell = (value) => {
  const raw = value == null ? "" : String(value);
  const safe = escapeFormula(raw);
  return '"' + safe.replaceAll('"', '""') + '"';
};
export function exportCsv(columns, rows) {
  if (!Array.isArray(columns) || !columns.length || columns.some(c => !c || typeof c.key !== "string" || typeof c.label !== "string")) {
    throw new TypeError("Colonnes CSV invalides");
  }
  if (!Array.isArray(rows)) throw new TypeError("Lignes CSV invalides");
  const lines = [
    columns.map(c => csvCell(c.label)).join(";"),
    ...rows.map(row => columns.map(c => csvCell(row?.[c.key])).join(";"))
  ];
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}
export const FESTAPP_CSV_COLUMNS = Object.freeze({
  events: [{key:"id",label:"Identifiant"},{key:"name",label:"Manifestation"},{key:"starts_at",label:"Date"},{key:"location",label:"Lieu"}],
  tasks: [{key:"id",label:"Identifiant"},{key:"event_id",label:"Manifestation ID"},{key:"label",label:"Tâche"},{key:"status",label:"Statut"}],
  people: [{key:"id",label:"Identifiant"},{key:"kind",label:"Catégorie"},{key:"display_name",label:"Nom"},{key:"email",label:"Courriel"},{key:"phone",label:"Téléphone"}],
  ecocups: [{key:"id",label:"Identifiant"},{key:"label",label:"Modèle"},{key:"balance",label:"Solde"},{key:"alert_threshold",label:"Seuil"}]
});
