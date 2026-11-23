-- TEST ONLY. Private metadata inventory; document bodies stay in Google Drive.
-- Do not apply to production without an independent review and member RLS tests.
create table if not exists public.festapp_drive_files (
  space_id uuid not null references public.festapp_spaces(id) on delete cascade,
  file_id text not null check (char_length(file_id) between 1 and 200),
  name text not null check (char_length(name) between 1 and 500),
  mime_type text not null check (char_length(mime_type) between 1 and 200),
  folder_path text not null check (char_length(folder_path) between 1 and 1200),
  web_url text not null check (web_url like 'https://drive.google.com/%' or web_url like 'https://docs.google.com/%'),
  modified_at timestamptz,
  indexed_at timestamptz not null default now(),
  primary key (space_id, file_id)
);

alter table public.festapp_drive_files enable row level security;

create policy "festapp test members read private Drive index"
on public.festapp_drive_files for select to authenticated using (
  space_id = 'd4dbe793-56bb-4dad-a76c-5ac322b1e5b1'::uuid
  and exists (
    select 1 from public.festapp_members m
    where m.space_id = festapp_drive_files.space_id
      and m.user_id = (select auth.uid())
  )
);

revoke all on public.festapp_drive_files from anon, authenticated;
grant select on public.festapp_drive_files to authenticated;

-- No INSERT/UPDATE/DELETE permissions for browser users. The committee Drive
-- index is maintained by a deliberately invoked, privileged TEST-only import.
