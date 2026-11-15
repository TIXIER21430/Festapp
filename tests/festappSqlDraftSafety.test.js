import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../docs/sql/festapp_mvp_schema_DRAFT_DO_NOT_APPLY.sql', import.meta.url), 'utf8');

test('draft migration has real newlines and no escaped newline tokens', () => {
  assert.doesNotMatch(sql, /\\n/);
  assert.match(sql, /revoke insert, update, delete on public\.fest_ecocup_movements from anon, authenticated;/i);
  assert.match(sql, /revoke insert, update, delete on public\.fest_ecocup_settings from anon, authenticated;/i);
});

test('all MVP tables have row-level security enabled', () => {
  assert.match(sql, /alter table public\.fest_members enable row level security;/i);
  for (const table of ['fest_events', 'fest_tasks', 'fest_contacts', 'fest_ecocup_settings', 'fest_ecocup_movements', 'fest_recipes']) {
    assert.ok(sql.includes("'"+table+"'"), table+' must be in the RLS loop');
  }
  assert.match(sql, /alter table public\.%I enable row level security/);
});

test('draft migration avoids destructive SQL and does not seed real data', () => {
  const statements = sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(statements, /\b(drop\s+table|truncate|delete\s+from|insert\s+into|alter\s+table\s+[^;]*\s+drop\s+)\b/i);
});

test('draft explicitly forbids browser writes to ecocup ledger', () => {
  assert.match(sql, /revoke insert, update, delete on public\.fest_ecocup_movements from anon, authenticated;/i);
  assert.match(sql, /revoke insert, update, delete on public\.fest_ecocup_settings from anon, authenticated;/i);
});
