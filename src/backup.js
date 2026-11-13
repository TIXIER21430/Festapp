// Pure, dependency-free validation for FEST'APP demo backups.
// No network calls and no access to a real Supabase database.
export const BACKUP_FORMAT = 'festapp-demo-backup';
export const BACKUP_VERSION = 1;
const allowed = new Set(['events','tasks','shopping','stock','ecocups','contacts','shifts','feedback','recipes','finance']);
const maxRows = 20000;
const maxChars = 5_000_000;
export function validateBackup(raw) {
  if (typeof raw !== 'string' || raw.length > maxChars) throw new Error('Sauvegarde trop volumineuse ou invalide');
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new Error('JSON invalide'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Format de sauvegarde invalide');
  if (parsed.format !== BACKUP_FORMAT || parsed.version !== BACKUP_VERSION) throw new Error('Version de sauvegarde incompatible');
  if (!parsed.data || typeof parsed.data !== 'object' || Array.isArray(parsed.data)) throw new Error('Données absentes');
  const clean = Object.create(null);
  let count = 0;
  for (const [key, rows] of Object.entries(parsed.data)) {
    if (!allowed.has(key) || !Array.isArray(rows)) throw new Error('Module inconnu ou invalide : ' + key);
    count += rows.length;
    if (count > maxRows) throw new Error('Trop de fiches');
    const ids = new Set();
    clean[key] = rows.map((row) => {
      if (!row || typeof row !== 'object' || Array.isArray(row) ||
          typeof row.id !== 'string' || !row.id || row.id.length > 150 ||
          !Array.isArray(row.values) || row.values.length !== 3 ||
          row.values.some(v => typeof v !== 'string' || v.length > 10000) ||
          ids.has(row.id)) throw new Error('Fiche invalide ou identifiant dupliqué : ' + key);
      ids.add(row.id);
      return { id: row.id, values: [...row.values] };
    });
  }
  return clean;
}
export function makeBackup(data, now = new Date()) {
  const raw = JSON.stringify({format:BACKUP_FORMAT,version:BACKUP_VERSION,createdAt:now.toISOString(),data});
  validateBackup(raw);
  return raw;
}
