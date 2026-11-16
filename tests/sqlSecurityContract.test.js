import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../docs/sql/festapp_mvp_test_only.sql', import.meta.url), 'utf8');

test('TEST migration contains no destructive table/data statements', () => {
  const clean = sql.replace(/--[^\n]*/g, '');
  assert.doesNotMatch(clean, /\b(?:drop|truncate|delete)\s+(?:table|from|schema)\b/i);
  assert.doesNotMatch(clean, /\balter\s+table\b[^;]*\bdisable\s+row\s+level\s+security\b/i);
});

test('all six shared tables enable RLS', () => {
  for (const table of ['fest_members', 'fest_events', 'fest_people', 'fest_tasks', 'fest_ecocup_inventory', 'fest_ecocup_movements']) {
    assert.match(sql, new RegExp('alter\\s+table\\s+public\\.' + table + '\\s+enable\\s+row\\s+level\\s+security', 'i'));
  }
});

test('stock mutation uses row locking and restricted RPC', () => {
  assert.match(sql, /where id = p_inventory for update/i);
  assert.match(sql, /security definer/i);
  assert.match(sql, /set search_path = ''/i);
  assert.match(sql, /revoke all on function public\.fest_record_ecocup\([^;]+from public, anon/i);
  assert.match(sql, /grant execute on function public\.fest_record_ecocup\([^;]+to authenticated/i);
});
