// Pure preflight for a future shared FEST'APP import. Never writes to storage.
export const MVP_COLLECTIONS = Object.freeze(['manifestations', 'taches', 'benevoles', 'exposants', 'groupes', 'ecocups']);
const MAX_RECORDS = 10000;
const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
export function preflightSharedImport(incoming, existing, options = {}) {
  const errors = [];
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming) ||
      !existing || typeof existing !== 'object' || Array.isArray(existing)) {
    return { ok: false, errors: ['Format des données invalide'], additions: {} };
  }
  if (options.environment !== 'test') errors.push('Import réservé à un environnement TEST explicitement identifié');
  const additions = {};
  for (const collection of MVP_COLLECTIONS) {
    const source = incoming[collection] ?? [];
    const target = existing[collection] ?? [];
    if (!Array.isArray(source) || !Array.isArray(target)) {
      errors.push(collection + ': tableau attendu');
      continue;
    }
    if (source.length + target.length > MAX_RECORDS) errors.push(collection + ': capacité dépassée');
    const ids = new Set();
    for (const item of target) {
      if (!item || typeof item !== 'object' || Array.isArray(item) || typeof item.id !== 'string' || !item.id.trim()) {
        errors.push(collection + ': identifiant existant invalide');
      } else if (ids.has(item.id)) errors.push(collection + ': doublon existant ' + item.id);
      else ids.add(item.id);
    }
    const additionsForCollection = [];
    for (const item of source) {
      if (!item || typeof item !== 'object' || Array.isArray(item) || typeof item.id !== 'string' || !item.id.trim()) {
        errors.push(collection + ': identifiant entrant invalide');
        continue;
      }
      if (ids.has(item.id)) errors.push(collection + ': conflit ' + item.id);
      else { ids.add(item.id); additionsForCollection.push(structuredClone(item)); }
    }
    additions[collection] = additionsForCollection;
  }
  for (const key of Object.keys(incoming)) if (!MVP_COLLECTIONS.includes(key)) errors.push('Catégorie inconnue : ' + key);
  // All-or-nothing: never expose a partially importable result on error.
  return errors.length ? { ok: false, errors, additions: {} } : { ok: true, errors: [], additions };
}
