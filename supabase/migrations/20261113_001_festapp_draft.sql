-- FEST'APP: proposition de migration additive NON APPLIQUÉE (environnement de test uniquement après validation).
-- Ne pas exécuter sur Supabase réel sans accord explicite et sauvegarde vérifiée.
create extension if not exists pgcrypto;
create schema if not exists festapp;

create table if not exists festapp.memberships (
  user_id uuid primary key references auth.users(id) on delete restrict,
  role text not null default 'bureau' check (role = 'bureau'),
  active boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists festapp.events (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 200),
  starts_on date,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists festapp.tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references festapp.events(id) on delete restrict,
  title text not null check (length(btrim(title)) between 1 and 200),
  assignee text,
  due_on date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists festapp.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 200),
  category text not null check (category in ('Bénévole','Exposant','Groupe / artiste','Partenaire','Autre')),
  contact_note text,
  email text,
  phone text,
  mailing_consent boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists festapp.ecocup_movements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references festapp.events(id) on delete restrict,
  kind text not null check (kind in ('initial','purchase','out','return','loss','adjust_in','adjust_out')),
  quantity integer not null check (quantity > 0),
  reason text,
  idempotency_key uuid not null unique,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (kind not in ('adjust_in','adjust_out') or nullif(btrim(reason),'') is not null)
);
create index if not exists festapp_tasks_event_idx on festapp.tasks(event_id);
create index if not exists festapp_ecocups_event_idx on festapp.ecocup_movements(event_id);
create index if not exists festapp_ecocups_created_idx on festapp.ecocup_movements(created_at,id);

-- Pas de privilège anonyme ; les accès authentifiés nécessitent une adhésion active.
revoke all on schema festapp from public, anon;
grant usage on schema festapp to authenticated;
revoke all on all tables in schema festapp from public, anon;
grant select, insert, update, delete on festapp.events, festapp.tasks, festapp.contacts to authenticated;
grant select, insert on festapp.ecocup_movements to authenticated;
grant select on festapp.memberships to authenticated;

create or replace function festapp.is_active_bureau()
returns boolean language sql stable security definer
set search_path = '' as $$
  select exists (
    select 1 from festapp.memberships m
    where m.user_id = (select auth.uid()) and m.active and m.role = 'bureau'
  );
$$;
revoke all on function festapp.is_active_bureau() from public, anon;
grant execute on function festapp.is_active_bureau() to authenticated;

alter table festapp.memberships enable row level security;
alter table festapp.events enable row level security;
alter table festapp.tasks enable row level security;
alter table festapp.contacts enable row level security;
alter table festapp.ecocup_movements enable row level security;

drop policy if exists memberships_self_read on festapp.memberships;
create policy memberships_self_read on festapp.memberships for select to authenticated
using (user_id = (select auth.uid()));
-- Pas de politique d'écriture memberships : provisionnement par administrateur DB uniquement.

drop policy if exists events_bureau on festapp.events;
create policy events_bureau on festapp.events for all to authenticated
using ((select festapp.is_active_bureau()))
with check ((select festapp.is_active_bureau()));
drop policy if exists tasks_bureau on festapp.tasks;
create policy tasks_bureau on festapp.tasks for all to authenticated
using ((select festapp.is_active_bureau()))
with check ((select festapp.is_active_bureau()));
drop policy if exists contacts_bureau on festapp.contacts;
create policy contacts_bureau on festapp.contacts for all to authenticated
using ((select festapp.is_active_bureau()))
with check ((select festapp.is_active_bureau()));
drop policy if exists ecocups_bureau_read on festapp.ecocup_movements;
create policy ecocups_bureau_read on festapp.ecocup_movements for select to authenticated
using ((select festapp.is_active_bureau()));
drop policy if exists ecocups_bureau_insert on festapp.ecocup_movements;
create policy ecocups_bureau_insert on festapp.ecocup_movements for insert to authenticated
with check ((select festapp.is_active_bureau()) and created_by = (select auth.uid()));

-- Attention : les mouvements sont append-only mais l'interdiction de solde négatif
-- nécessite une transaction RPC avec verrouillage côté DB (à implémenter et tester).
-- Ne PAS connecter l'UI aux écritures directes avant cette RPC et ses tests de concurrence.
