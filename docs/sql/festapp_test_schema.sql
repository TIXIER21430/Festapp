-- Applied only to Supabase project FESTAPP TEST (ddpaxzdwxqwypcumjvvn) on 2026-11-18.
-- NEVER apply this file to the live project without separate review.
create table public.festapp_spaces (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(btrim(name)) between 1 and 160),
 created_at timestamptz not null default now()
);
create table public.festapp_members (
 space_id uuid not null references public.festapp_spaces(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade deferrable initially immediate,
 role text not null default 'viewer' check (role in ('admin','editor','viewer')),
 created_at timestamptz not null default now(),
 primary key (space_id,user_id)
);
create index festapp_members_by_user on public.festapp_members(user_id,space_id);
create table public.festapp_snapshots (
 space_id uuid primary key references public.festapp_spaces(id) on delete cascade,
 revision bigint not null default 1 check (revision>0),
 payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload)='object'),
 updated_at timestamptz not null default now()
);
alter table public.festapp_spaces enable row level security;
alter table public.festapp_members enable row level security;
alter table public.festapp_snapshots enable row level security;
create policy "member sees own membership" on public.festapp_members
 for select to authenticated using (user_id=(select auth.uid()));
create policy "member sees own spaces" on public.festapp_spaces
 for select to authenticated using (
  exists (select 1 from public.festapp_members m where m.space_id=id and m.user_id=(select auth.uid()))
 );
create policy "member reads own snapshot" on public.festapp_snapshots
 for select to authenticated using (
  exists (select 1 from public.festapp_members m where m.space_id=festapp_snapshots.space_id and m.user_id=(select auth.uid()))
 );
create policy "editor updates own snapshot" on public.festapp_snapshots
 for update to authenticated
 using (exists (
  select 1 from public.festapp_members m
  where m.space_id=festapp_snapshots.space_id and m.user_id=(select auth.uid()) and m.role in ('admin','editor')
 ))
 with check (exists (
  select 1 from public.festapp_members m
  where m.space_id=festapp_snapshots.space_id and m.user_id=(select auth.uid()) and m.role in ('admin','editor')
 ));
create function public.festapp_guard_snapshot_update() returns trigger
 language plpgsql security invoker set search_path = ''
 as $$
 begin
  if new.space_id is distinct from old.space_id then
   raise exception 'Changing the space is forbidden' using errcode='42501';
  end if;
  if new.revision is distinct from old.revision+1 then
   raise exception 'Snapshot revision conflict' using errcode='40001';
  end if;
  if pg_catalog.pg_column_size(new.payload)>1048576 then
   raise exception 'Snapshot exceeds 1 MiB' using errcode='22001';
  end if;
  new.updated_at=pg_catalog.now();
  return new;
 end;
 $$;
revoke all on function public.festapp_guard_snapshot_update() from public;
create trigger festapp_snapshot_version_guard before update on public.festapp_snapshots
 for each row execute function public.festapp_guard_snapshot_update();
revoke all on public.festapp_spaces,public.festapp_members,public.festapp_snapshots from anon,authenticated;
grant select on public.festapp_spaces,public.festapp_members,public.festapp_snapshots to authenticated;
grant update(payload,revision) on public.festapp_snapshots to authenticated;
with s as (insert into public.festapp_spaces(name) values ('FESTAPP TEST — Comité des fêtes de Liernais') returning id)
insert into public.festapp_snapshots(space_id,payload)
select id,'{"data":{},"volunteerNeeds":{}}'::jsonb from s;
