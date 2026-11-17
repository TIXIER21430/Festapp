-- FEST'APP — TEST DRAFT ONLY. DO NOT APPLY TO PRODUCTION.
-- Run only on a separately confirmed disposable Supabase TEST project.
-- No destructive statements and no anonymous access.
create table if not exists public.fest_till_menus (
 event_name text primary key check (length(trim(event_name)) between 1 and 120),
 menu jsonb not null check (jsonb_typeof(menu) = 'array' and jsonb_array_length(menu) <= 15),
 updated_at timestamptz not null default now(),
 updated_by uuid not null references auth.users(id)
);
alter table public.fest_till_menus enable row level security;
-- A trusted administrator provisions fest_members; users cannot add themselves.
create policy "fest_till_menus_member_read" on public.fest_till_menus
 for select to authenticated
 using (exists (select 1 from public.fest_members m where m.user_id=(select auth.uid())));
create policy "fest_till_menus_member_insert" on public.fest_till_menus
 for insert to authenticated
 with check (
  updated_by=(select auth.uid())
  and exists (select 1 from public.fest_members m where m.user_id=(select auth.uid()))
 );
create policy "fest_till_menus_member_update" on public.fest_till_menus
 for update to authenticated
 using (exists (select 1 from public.fest_members m where m.user_id=(select auth.uid())))
 with check (
  updated_by=(select auth.uid())
  and exists (select 1 from public.fest_members m where m.user_id=(select auth.uid()))
 );
-- Do not allow DELETE from the client.
grant select,insert,update on public.fest_till_menus to authenticated;
revoke all on public.fest_till_menus from anon;
-- Before enabling Realtime, validate RLS and publication behavior in TEST.
-- For publication setup, see Supabase Postgres Changes documentation.
