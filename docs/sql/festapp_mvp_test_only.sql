-- FEST'APP MVP — PROJET SUPABASE TEST UNIQUEMENT. NE PAS EXECUTER EN PRODUCTION.
-- Migration additive de preparation. A relire et tester avant toute application.
-- Depend de auth.users fourni par Supabase. Aucune donnee de demonstration n'est importee.
begin;
create extension if not exists pgcrypto;
create table if not exists public.fest_members (
 user_id uuid primary key references auth.users(id),
 role text not null check (role in ('admin','editor','reader')),
 created_at timestamptz not null default now()
);
create table if not exists public.fest_events (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(trim(name)) between 1 and 200),
 starts_at timestamptz,
 location text,
 archived_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.fest_people (
 id uuid primary key default gen_random_uuid(),
 kind text not null check (kind in ('volunteer','exhibitor','group')),
 display_name text not null check (length(trim(display_name)) between 1 and 200),
 email text,
 phone text,
 notes text,
 archived_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.fest_tasks (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.fest_events(id),
 label text not null check (length(trim(label)) between 1 and 300),
 status text not null default 'todo' check (status in ('todo','doing','done')),
 due_at timestamptz,
 assignee_id uuid references public.fest_people(id),
 archived_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.fest_ecocup_inventory (
 id uuid primary key default gen_random_uuid(),
 label text not null,
 balance integer not null default 0 check (balance >= 0),
 alert_threshold integer not null default 0 check (alert_threshold >= 0),
 created_at timestamptz not null default now()
);
create table if not exists public.fest_ecocup_movements (
 id uuid primary key default gen_random_uuid(),
 inventory_id uuid not null references public.fest_ecocup_inventory(id),
 event_id uuid references public.fest_events(id),
 delta integer not null check (delta <> 0),
 request_key uuid not null unique,
 actor_id uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create index if not exists fest_tasks_event_idx on public.fest_tasks(event_id);
create index if not exists fest_ecocup_movements_inventory_idx on public.fest_ecocup_movements(inventory_id,created_at);
-- RLS : aucun acces sans adhesion; contacts reserves aux roles admin/editor.
alter table public.fest_members enable row level security;
alter table public.fest_events enable row level security;
alter table public.fest_people enable row level security;
alter table public.fest_tasks enable row level security;
alter table public.fest_ecocup_inventory enable row level security;
alter table public.fest_ecocup_movements enable row level security;
-- IMPORTANT : aucune politique permettant au client de modifier fest_members.
-- L'attribution initiale des roles se fait uniquement par administrateur serveur de TEST.
create policy fest_members_self_read on public.fest_members for select to authenticated
 using (user_id = (select auth.uid()));
create policy fest_events_read on public.fest_events for select to authenticated
 using (exists (select 1 from public.fest_members m where m.user_id = (select auth.uid())));
create policy fest_events_write on public.fest_events for all to authenticated
 using (exists (select 1 from public.fest_members m where m.user_id = (select auth.uid()) and m.role in ('admin','editor')))
 with check (exists (select 1 from public.fest_members m where m.user_id = (select auth.uid()) and m.role in ('admin','editor')));
create policy fest_people_read on public.fest_people for select to authenticated
 using (exists (select 1 from public.fest_members m where m.user_id = (select auth.uid()) and m.role in ('admin','editor')));
create policy fest_people_write on public.fest_people for all to authenticated
 using (exists (select 1 from public.fest_members m where m.user_id = (select auth.uid()) and m.role in ('admin','editor')))
 with check (exists (select 1 from public.fest_members m where m.user_id = (select auth.uid()) and m.role in ('admin','editor')));
create policy fest_tasks_read on public.fest_tasks for select to authenticated
 using (exists (select 1 from public.fest_members m where m.user_id = (select auth.uid())));
create policy fest_tasks_write on public.fest_tasks for all to authenticated
 using (exists (select 1 from public.fest_members m where m.user_id = (select auth.uid()) and m.role in ('admin','editor')))
 with check (exists (select 1 from public.fest_members m where m.user_id = (select auth.uid()) and m.role in ('admin','editor')));
create policy fest_ecocup_inventory_read on public.fest_ecocup_inventory for select to authenticated
 using (exists (select 1 from public.fest_members m where m.user_id = (select auth.uid())));
create policy fest_ecocup_movements_read on public.fest_ecocup_movements for select to authenticated
 using (exists (select 1 from public.fest_members m where m.user_id = (select auth.uid())));
-- Aucun INSERT/UPDATE/DELETE direct sur inventaire ou mouvements depuis le navigateur.
-- Fonction transactionnelle : verrouillage de l'inventaire, controle d'idempotence et de solde.
create or replace function public.fest_record_ecocup(
 p_inventory uuid, p_event uuid, p_delta integer, p_request_key uuid
) returns integer language plpgsql security definer
 set search_path = '' as $$
declare
 v_actor uuid := auth.uid();
 v_balance integer;
 v_previous public.fest_ecocup_movements%rowtype;
begin
 if v_actor is null or not exists (
  select 1 from public.fest_members m
  where m.user_id = v_actor and m.role in ('admin','editor')
 ) then raise exception 'Not authorized' using errcode = '42501'; end if;
 if p_delta is null or p_delta = 0 or p_request_key is null then
  raise exception 'Invalid movement';
 end if;
 select balance into v_balance from public.fest_ecocup_inventory
 where id = p_inventory for update;
 if not found then raise exception 'Unknown inventory'; end if;
 select * into v_previous from public.fest_ecocup_movements where request_key = p_request_key;
 if found then
  if v_previous.inventory_id <> p_inventory or
     v_previous.delta <> p_delta or
     v_previous.event_id is distinct from p_event or
     v_previous.actor_id <> v_actor then
   raise exception 'Idempotency key reused with different payload';
  end if;
  return v_balance;
 end if;
 if v_balance + p_delta < 0 then raise exception 'Insufficient ecocups'; end if;
 insert into public.fest_ecocup_movements(inventory_id,event_id,delta,request_key,actor_id)
 values (p_inventory,p_event,p_delta,p_request_key,v_actor);
 update public.fest_ecocup_inventory set balance = balance + p_delta where id = p_inventory;
 return v_balance + p_delta;
end $$;
revoke all on function public.fest_record_ecocup(uuid,uuid,integer,uuid) from public, anon;
grant execute on function public.fest_record_ecocup(uuid,uuid,integer,uuid) to authenticated;
-- La creation initiale d'inventaire est une operation admin serveur TEST; pas de write client.
commit;
