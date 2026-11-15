/**
 * Stable event identifiers for FEST'APP. Pure helpers: no browser storage or network.
 * Never derive an event identifier from its editable display name.
 */
export function validateManifestationId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(id);
}
export function indexManifestations(manifestations) {
  if (!Array.isArray(manifestations)) throw new TypeError('manifestations must be an array');
  const byId = new Map();
  for (const event of manifestations) {
    if (!event || !validateManifestationId(event.id)) throw new Error('Invalid manifestation ID');
    if (byId.has(event.id)) throw new Error('Duplicate manifestation ID');
    byId.set(event.id, event);
  }
  return byId;
}
/**
 * Read-only reconciliation of tasks against events. No automatic rewriting of
 * legacy name-based tasks: ambiguous names require explicit human review.
 */
export function reconcileManifestationTasks(manifestations, tasks) {
  const byId = indexManifestations(manifestations);
  if (!Array.isArray(tasks)) throw new TypeError('tasks must be an array');
  const byName = new Map();
  for (const event of manifestations) {
    const name = typeof event.nom === 'string' ? event.nom.trim() : '';
    if (!name) continue;
    const matches = byName.get(name) || [];
    matches.push(event.id);
    byName.set(name, matches);
  }
  return tasks.map((task) => {
    if (!task || typeof task !== 'object') throw new TypeError('Invalid task');
    if (task.manifestationId != null) {
      return { task, status: byId.has(task.manifestationId) ? 'linked' : 'missing', eventId: byId.has(task.manifestationId) ? task.manifestationId : null };
    }
    const name = typeof task.manifestation === 'string' ? task.manifestation.trim() : '';
    const ids = byName.get(name) || [];
    return { task, status: ids.length === 1 ? 'suggested' : ids.length > 1 ? 'ambiguous' : 'missing', eventId: ids.length === 1 ? ids[0] : null };
  });
}
