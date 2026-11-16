-- FEST'APP MVP — DRAFT ONLY. DO NOT APPLY TO A REAL SUPABASE PROJECT.
-- Additive schema, intended for an isolated disposable test database first.
-- No DROP, DELETE, TRUNCATE or destructive ALTER.
create extension if not exists pgcrypto;

create table if not exists public.fest_members (
  user_id uuid primary key references auth.users(id),
  display_name text not null default '',
  created_at timestamptz not null default now()
);
alter table public.fest_members enable row level security;
create policy "fest_members_read_self" on public.fest_members
  for select to authenticated using (user_id = (select auth.uid()));
-- Membership must be provisioned by a trusted administrator/server, never the browser.

create table if not exists public.fest_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 200),
  event_date date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.fest_tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.fest_events(id) on delete restrict,
  title text not null check (length(trim(title)) between 1 and 200),
  done boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.fest_contacts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('benevole','exposant','groupe')),
  name text not null check (length(trim(name)) between 1 and 200),
  email text,
  phone text,
  notes text not null default '',
  created_at timestamptz not null default now()
);
create table if not exists public.fest_ecocup_settings (
  id boolean primary key default true check (id),
  initial_stock integer not null default 0 check (initial_stock >= 0),
  alert_threshold integer not null default 0 check (alert_threshold >= 0)
);
create table if not exists public.fest_ecocup_movements (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('achat','sortie','retour','perte','correction')),
  quantity integer not null check (quantity > 0),
  -- signed_delta is explicit for audited corrections; other types are derived by app logic.
  -- Positive stock movements must increase stock; outgoing movements decrease it.
  -- Corrections may be signed, but their magnitude must match the recorded quantity.
  signed_delta integer not null check (signed_delta <> 0),
  constraint fest_ecocup_movement_sign_consistency check (
    (kind in ('achat','retour') and signed_delta = quantity)
    or (kind in ('sortie','perte') and signed_delta = -quantity)
    or (kind = 'correction' and abs(signed_delta::bigint) = quantity::bigint)
  ),
  note text not null default '',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
create table if not exists public.fest_recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 200),
  reference_servings integer not null check (reference_servings > 0),
  ingredients jsonb not null default '[]'::jsonb check (jsonb_typeof(ingredients) = 'array'),
  instructions text not null default '',
  original_image_path text,
  created_at timestamptz not null default now()
);
create index if not exists fest_tasks_event_idx on public.fest_tasks(event_id);
create index if not exists fest_contacts_kind_idx on public.fest_contacts(kind);
create index if not exists fest_ecocup_movements_created_idx on public.fest_ecocup_movements(created_at);

-- Explicitly restrict every table to authenticated members of this single committee.
-- This is a preliminary policy: test grants, membership provisioning and role boundaries
-- before considering any deployment. Never add anon policies.
do $$
declare tab text;
begin
  foreach tab in array array[
    'fest_events','fest_tasks','fest_contacts','fest_ecocup_settings',
    'fest_ecocup_movements','fest_recipes'
  ] loop
    execute format('alter table public.%I enable row level security',tab);
    execute format(
      'create policy %I on public.%I for all to authenticated using (exists (select 1 from public.fest_members m where m.user_id = (select auth.uid()))) with check (exists (select 1 from public.fest_members m where m.user_id = (select auth.uid())))',
      tab || '_members_only',tab
    );
  end loop;
end $$;

-- IMPORTANT: direct writes to ecocup movements are forbidden until an atomic
-- SECURITY DEFINER RPC with locking, idempotency and balance checks is tested.
-- These REVOKEs apply even if broad table grants exist elsewhere.
revoke insert, update, delete on public.fest_ecocup_movements from anon, authenticated;
revoke insert, update, delete on public.fest_ecocup_settings from anon, authenticated;

-- Intentionally no INSERT of demo records and no new API grants here.
-- Validate the Data API grants and RLS with two test users (member/non-member)
-- and an anonymous request in an isolated environment before production use.
