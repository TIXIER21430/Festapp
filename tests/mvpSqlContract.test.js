// Static safety checks only: NOT a substitute for PostgreSQL/RLS integration tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../docs/sql/festapp_mvp_test_only.sql', import.meta.url), 'utf8');
const normalized = sql.toLowerCase();

test('migration is explicitly test-only and additive', () => {
  assert.match(sql, /TEST UNIQUEMENT/);
  assert.doesNotMatch(normalized, /\b(drop\s+table|truncate\s+|delete\s+from)\b/);
  assert.match(normalized, /begin;/);
  assert.match(normalized, /commit;/);
});
test('all shared tables enable RLS', () => {
  for (const table of ['fest_members','fest_events','fest_people','fest_tasks','fest_ecocup_inventory','fest_ecocup_movements']) {
    assert.ok(normalized.includes('alter table public.' + table + ' enable row level security;'), table);
  }
});
test('contact details are restricted to admin and editor', () => {
  assert.match(normalized, /create policy fest_people_read[\s\S]*?m\.role in \('admin','editor'\)/);
});
test('ecocup RPC checks authorization, idempotency, row lock and negative balance', () => {
  assert.match(normalized, /security definer/);
  assert.match(normalized, /set search_path = ''/);
  assert.match(normalized, /for update/);
  assert.match(normalized, /request_key uuid not null unique/);
  assert.match(normalized, /v_balance \+ p_delta < 0/);
  assert.match(normalized, /revoke all on function public\.fest_record_ecocup\(uuid,uuid,integer,uuid\) from public, anon/);
});
test('tasks reference events by stable UUID', () => {
  assert.match(normalized, /event_id uuid not null references public\.fest_events\(id\)/);
});
