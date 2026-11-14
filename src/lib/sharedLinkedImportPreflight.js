// Pure referential-integrity check for a future TEST-only shared import.
// No database, storage or network access. Never modifies caller objects.
import { preflightSharedImport } from './sharedImportPreflight.js';

export function preflightLinkedSharedImport(incoming, existing, options = {}) {
  const base = preflightSharedImport(incoming, existing, options);
  if (!base.ok) return base;
  const errors = [];
  const events = new Set([...(existing.manifestations ?? []), ...(base.additions.manifestations ?? [])].map(x => x.id));
  const tasks = [...(existing.taches ?? []), ...(base.additions.taches ?? [])];
  for (const task of tasks) {
    if (typeof task.event_id !== 'string' || !events.has(task.event_id)) {
      errors.push('taches: manifestation absente pour ' + task.id);
    }
  }
  return errors.length
    ? { ok: false, errors, additions: {} }
    : base;
}
