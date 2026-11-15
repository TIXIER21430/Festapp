import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../docs/sql/festapp_mvp_schema_DRAFT_DO_NOT_APPLY.sql', import.meta.url), 'utf8');
const tables = ['fest_members', 'fest_events', 'fest_tasks', 'fest_contacts', 'fest_ecocup_settings', 'fest_ecocup_movements', 'fest_recipes'];

test('draft contains all required MVP entities', () => {
  for (const name of tables) assert.match(sql, new RegExp('create table if not exists public\\.' + name + '\\b', 'i'));
});

test('draft is additive and does not manipulate actual records', () => {
  assert.doesNotMatch(sql.replace(/--[^\n]*/g, ''), /\b(drop|truncate|delete\s+from|update\s+public\.|insert\s+into)\b/i);
});

test('RLS is enabled on member directory and every application table', () => {
  assert.match(sql, /alter table public\.fest_members enable row level security/i);
  assert.match(sql, /alter table public\.%I enable row level security/i);
  for (const name of tables.slice(1)) assert.ok(sql.includes("'" + name + "'"), name);
});

test('membership must be explicitly provisioned and cannot self-register', () => {
  assert.match(sql, /fest_members_read_self/);
  assert.doesNotMatch(sql, /create policy[^;]*fest_members[^;]*for insert/i);
});

test('ecocup direct writes are denied until transaction RPC is tested', () => {
  for (const table of ['fest_ecocup_movements', 'fest_ecocup_settings']) {
    assert.match(sql, new RegExp('revoke insert, update, delete on public\\.' + table + ' from anon, authenticated', 'i'));
  }
});

test('event tasks have a foreign key and contact kinds are constrained', () => {
  assert.match(sql, /event_id uuid not null references public\.fest_events\(id\)/);
  assert.match(sql, /kind in \('benevole','exposant','groupe'\)/);
});

// Static checks only: cannot establish PostgreSQL execution, grants, RLS,
// multi-user concurrency, backups or restoration correctness.
