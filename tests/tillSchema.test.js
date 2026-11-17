import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const sql=readFileSync(new URL("../docs/sql/festapp_till_menus_TEST_DRAFT_DO_NOT_APPLY.sql",import.meta.url),"utf8");
test("shared till draft enables RLS and only grants authenticated members",()=>{
 assert.match(sql,/enable row level security/i);
 assert.match(sql,/to authenticated/i);
 assert.match(sql,/fest_members/i);
 assert.match(sql,/revoke all on public\.fest_till_menus from anon/i);
 assert.doesNotMatch(sql,/create policy[^;]+to anon/i);
});
test("draft is additive and cannot destroy data",()=>{
 assert.doesNotMatch(sql,/\b(drop|truncate|delete from)\b/i);
 assert.match(sql,/updated_by\s+uuid\s+not null/i);
});
