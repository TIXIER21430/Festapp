import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../docs/sql/festapp_mvp_schema_DRAFT_DO_NOT_APPLY.sql', import.meta.url), 'utf8');
const normalized = sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

test('MVP schema links tasks to event IDs and forbids cascading deletion', () => {
  assert.match(normalized, /event_id\s+uuid\s+not null\s+references\s+public\.fest_events\(id\)\s+on\s+delete\s+restrict/i);
  assert.doesNotMatch(normalized, /on\s+delete\s+cascade/i);
});

test('MVP contacts constrain categories and keep email and phone separate', () => {
  assert.match(normalized, /kind\s+text\s+not null\s+check\s*\(kind\s+in\s*\('benevole','exposant','groupe'\)\)/i);
  assert.match(normalized, /email\s+text\s*,\s*phone\s+text/i);
});

test('MVP draft does not grant anonymous access or install sample rows', () => {
  assert.doesNotMatch(normalized, /\bgrant\s+[^;]*\bto\s+(?:public|anon)\b/i);
  assert.doesNotMatch(normalized, /\binsert\s+into\b/i);
  assert.match(normalized, /revoke\s+insert,\s*update,\s*delete\s+on\s+public\.fest_ecocup_movements\s+from\s+anon,\s*authenticated/i);
});

test('MVP draft requires membership and RLS, with no anonymous policies', () => {
  assert.match(normalized, /alter\s+table\s+public\.fest_members\s+enable\s+row\s+level\s+security/i);
  assert.match(normalized, /select\s+1\s+from\s+public\.fest_members\s+m\s+where\s+m\.user_id\s*=\s*\(select\s+auth\.uid\(\)\)/i);
  assert.doesNotMatch(normalized, /create\s+policy\s+[^;]*\bto\s+anon\b/i);
});
