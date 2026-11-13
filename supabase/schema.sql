-- FEST'APP - Schéma indépendant. À exécuter UNIQUEMENT dans un projet Supabase FEST'APP distinct.
-- Ne jamais exécuter dans la base TIXAPP.
create extension if not exists pgcrypto;

create table if not exists public.festapp_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.festapp_records (
  id uuid primary key default gen_random_uuid(),
  module text not null check (module in ('events','tasks','shopping','stock','ecocups','contacts','shifts','feedback','recipes','finance')),
  fields jsonb not null check (jsonb_typeof(fields) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.festapp_settings (
  setting_key text primary key,
  value jsonb not null
);

create index if not exists festapp_records_module_idx on public.festapp_records(module);
alter table public.festapp_members enable row level security;
alter table public.festapp_records enable row level security;
alter table public.festapp_settings enable row level security;

-- L'appartenance est validée côté base. L'utilisateur ne peut pas s'ajouter lui-même.
revoke all on public.festapp_members from anon, authenticated;
revoke all on public.festapp_records from anon, authenticated;
revoke all on public.festapp_settings from anon, authenticated;
grant select on public.festapp_members to authenticated;
grant select, insert, update, delete on public.festapp_records to authenticated;
grant select, insert, update, delete on public.festapp_settings to authenticated;

create policy "Membres peuvent voir leur inscription"
on public.festapp_members for select to authenticated
using (user_id = (select auth.uid()));

create policy "Membres peuvent consulter les fiches"
on public.festapp_records for select to authenticated
using (exists (select 1 from public.festapp_members m where m.user_id = (select auth.uid())));
create policy "Membres peuvent ajouter des fiches"
on public.festapp_records for insert to authenticated
with check (exists (select 1 from public.festapp_members m where m.user_id = (select auth.uid())));
create policy "Membres peuvent modifier les fiches"
on public.festapp_records for update to authenticated
using (exists (select 1 from public.festapp_members m where m.user_id = (select auth.uid())))
with check (exists (select 1 from public.festapp_members m where m.user_id = (select auth.uid())));
create policy "Membres peuvent supprimer des fiches"
on public.festapp_records for delete to authenticated
using (exists (select 1 from public.festapp_members m where m.user_id = (select auth.uid())));

create policy "Membres peuvent consulter les réglages"
on public.festapp_settings for select to authenticated
using (exists (select 1 from public.festapp_members m where m.user_id = (select auth.uid())));
create policy "Membres peuvent ajouter les réglages"
on public.festapp_settings for insert to authenticated
with check (exists (select 1 from public.festapp_members m where m.user_id = (select auth.uid())));
create policy "Membres peuvent modifier les réglages"
on public.festapp_settings for update to authenticated
using (exists (select 1 from public.festapp_members m where m.user_id = (select auth.uid())))
with check (exists (select 1 from public.festapp_members m where m.user_id = (select auth.uid())));
create policy "Membres peuvent supprimer les réglages"
on public.festapp_settings for delete to authenticated
using (exists (select 1 from public.festapp_members m where m.user_id = (select auth.uid())));

-- Premier membre : après création manuelle de son compte Auth, insertion par un administrateur
-- depuis l'éditeur SQL dans le PROJET FEST'APP UNIQUEMENT :
-- insert into public.festapp_members(user_id,display_name)
-- values ('UUID_AUTH_UTILISATEUR', 'Membre du bureau');
-- Ajouter les autres membres de la même manière (10 membres du bureau).
-- Aucun accès pour bénévoles non inscrits ; pas de création de membres depuis le navigateur.
