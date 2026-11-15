/**
 * Read-only adapter for the current local-demo record format.
 * It does not rewrite legacy records or persist inferred relationships.
 */
import { reconcileManifestationTasks } from './manifestationIdentity.js';

export function inspectDemoTaskLinks(eventRecords, taskRecords) {
  if (!Array.isArray(eventRecords) || !Array.isArray(taskRecords)) {
    throw new TypeError('Event and task records must be arrays');
  }
  const events = eventRecords.map(record => {
    if (!record || !Array.isArray(record.values) || typeof record.values[0] !== 'string') {
      throw new TypeError('Invalid demo event record');
    }
    return { id: record.id, nom: record.values[0] };
  });
  const tasks = taskRecords.map(record => {
    if (!record || !Array.isArray(record.values) || typeof record.values[0] !== 'string') {
      throw new TypeError('Invalid demo task record');
    }
    return { id: record.id, titre: record.values[0], manifestationId: record.manifestationId ?? null, manifestation: record.manifestation ?? '' };
  });
  const results = reconcileManifestationTasks(events, tasks);
  return {
    linked: results.filter(r => r.status === 'linked').length,
    suggested: results.filter(r => r.status === 'suggested').length,
    ambiguous: results.filter(r => r.status === 'ambiguous').length,
    missing: results.filter(r => r.status === 'missing').length,
    details: results.map((r, i) => ({ taskId: taskRecords[i].id, status: r.status, eventId: r.eventId }))
  };
}
