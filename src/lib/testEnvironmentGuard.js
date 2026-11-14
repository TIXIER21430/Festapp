// Explicit guard for future TEST-only database integration.
// Never treat a Vite mode name or localhost as proof of an isolated database.
export function assertIsolatedTestBackend({ url, expectedProjectRef, confirmedTestProject } = {}) {
  if (confirmedTestProject !== true) throw new Error('Projet Supabase TEST non confirmé');
  if (typeof url !== 'string' || typeof expectedProjectRef !== 'string') throw new Error('Configuration TEST manquante');
  const ref = expectedProjectRef.trim();
  if (!/^[a-z0-9]{20}$/.test(ref)) throw new Error('Référence de projet TEST invalide');
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('URL Supabase TEST invalide'); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password ||
      parsed.hostname !== ref + '.supabase.co' || parsed.pathname !== '/' ||
      parsed.search || parsed.hash) throw new Error('URL Supabase différente du projet TEST confirmé');
  return { projectRef: ref, url: parsed.origin };
}
