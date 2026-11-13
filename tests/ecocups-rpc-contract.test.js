import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../supabase/migrations/20261113_002_ecocups_atomic_draft.sql', import.meta.url), 'utf8');

test('écocups: les insertions directes sont retirées aux utilisateurs', () => {
  assert.match(sql, /revoke insert on festapp\.ecocup_movements from authenticated/i);
});
test('écocups: la RPC vérifie membre actif et auteur authentifié', () => {
  assert.match(sql, /auth\.uid\(\)/);
  assert.match(sql, /not festapp\.is_active_bureau\(\)/);
});
test('écocups: verrou transactionnel avant calcul et insertion', () => {
  const lock = sql.indexOf('pg_advisory_xact_lock');
  const balance = sql.indexOf('select coalesce(sum(');
  const insert = sql.indexOf('insert into festapp.ecocup_movements');
  assert.ok(lock >= 0 && lock < balance && balance < insert);
});
test('écocups: répétition idempotente contrôlée avant écriture', () => {
  assert.match(sql, /where idempotency_key = p_idempotency_key/);
  assert.match(sql, /v_existing\.created_by <> v_actor/);
  assert.match(sql, /return v_existing/);
});
test('écocups: aucun solde négatif autorisé', () => {
  assert.match(sql, /v_balance \+ v_delta < 0/);
  assert.match(sql, /Stock écocups insuffisant/);
});
test('écocups: corrections motivées et fonction non publique', () => {
  assert.match(sql, /p_kind in \('adjust_in','adjust_out'\)/);
  assert.match(sql, /revoke all on function festapp\.record_ecocup_movement/);
});
