-- DRAFT ONLY: never apply to production. Requires TEST-only review and RLS
-- tests with a member, a non-member, an anonymous session and another space.
-- Each archive is immutable (no UPDATE or DELETE grants to app users).
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('festapp-private-backups-test','festapp-private-backups-test',false,40000000,array['application/zip'])
on conflict (id) do nothing;

create policy "festapp test member reads private ZIP archives"
on storage.objects for select to authenticated using (
 bucket_id='festapp-private-backups-test'
 and (storage.foldername(name))[1]='d4dbe793-56bb-4dad-a76c-5ac322b1e5b1'
 and exists (
  select 1 from public.festapp_members m
  where m.space_id='d4dbe793-56bb-4dad-a76c-5ac322b1e5b1'::uuid
   and m.user_id=(select auth.uid())
 )
);

create policy "festapp test writer inserts own immutable ZIP archives"
on storage.objects for insert to authenticated with check (
 bucket_id='festapp-private-backups-test'
 and (storage.foldername(name))[1]='d4dbe793-56bb-4dad-a76c-5ac322b1e5b1'
 and (storage.foldername(name))[2]=(select auth.uid())::text
 and exists (
  select 1 from public.festapp_members m
  where m.space_id='d4dbe793-56bb-4dad-a76c-5ac322b1e5b1'::uuid
   and m.user_id=(select auth.uid()) and m.role in ('admin','editor')
 )
);

-- No public bucket, no anon access, no upsert, and no automatic retention
-- deletion. Review costs, storage growth and restore rights before enabling.
