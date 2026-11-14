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

test('membership roles cannot be assigned by client policies', () => {
  const policies = [...normalized.matchAll(/create\s+policy\s+\w+\s+on\s+public\.fest_members\s+for\s+(\w+)/g)].map(m => m[1]);
  assert.deepEqual(policies, ['select']);
  assert.match(normalized, /fest_members_self_read[\s\S]*?user_id\s*=\s*\(select auth\.uid\(\)\)/);
});
test('contact records have no reader or anonymous access', () => {
  const readPolicy = normalized.match(/create policy fest_people_read[\s\S]*?(?=create policy|-- aucun|alter table|commit;)/)?.[0] ?? '';
  assert.match(readPolicy, /to authenticated/);
  assert.match(readPolicy, /'admin','editor'/);
  assert.doesNotMatch(readPolicy, /'reader'/);
});
test('ecocup tables expose no direct client write policies', () => {
  for (const table of ['fest_ecocup_inventory', 'fest_ecocup_movements']) {
    const policies = [...normalized.matchAll(new RegExp('create\\s+policy\\s+\\w+\\s+on\\s+public\\.' + table + '\\s+for\\s+(\\w+)', 'g'))].map(m => m[1]);
    assert.deepEqual(policies, ['select'], table);
  }
});
test('ecocup idempotency validates the original actor and payload', () => {
  assert.match(normalized, /v_previous\.inventory_id\s*<>\s*p_inventory/);
  assert.match(normalized, /v_previous\.delta\s*<>\s*p_delta/);
  assert.match(normalized, /v_previous\.event_id\s+is distinct from\s+p_event/);
  assert.match(normalized, /v_previous\.actor_id\s*<>\s*v_actor/);
});
