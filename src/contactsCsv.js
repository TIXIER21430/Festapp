// Export explicite uniquement : aucune lecture réseau ni modification des données.
// Ne jamais exposer ces exports à un utilisateur non autorisé.
const COLUMNS = ['id', 'kind', 'display_name', 'email', 'phone', 'notes'];
const KINDS = new Set(['volunteer', 'exhibitor', 'group']);

function csvCell(value) {
  const raw = String(value ?? '');
  // Empêche l'exécution de formules dans Excel/LibreOffice, même après espaces.
  const safe = /^[\s\uFEFF\u200B]*[=+@-]/u.test(raw) ? "'" + raw : raw;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export function exportContactsCsv(contacts) {
  if (!Array.isArray(contacts)) throw new TypeError('Contacts invalides');
  const rows = contacts.map((contact) => {
    if (!contact || typeof contact !== 'object' || !KINDS.has(contact.kind)) {
      throw new TypeError('Catégorie de contact invalide');
    }
    return COLUMNS.map((column) => csvCell(contact[column])).join(',');
  });
  return '\uFEFF' + [COLUMNS.join(','), ...rows].join('\r\n') + '\r\n';
}
