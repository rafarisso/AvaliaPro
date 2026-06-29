-- ============================================================
-- AvaliaPro — Migration 003
-- Bucket privado para provas escaneadas + policies de Storage.
-- Cada professor acessa apenas a própria pasta (auth.uid()/...).
-- A correção (Netlify Function) usa a service role e ignora o RLS.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('provas-escaneadas', 'provas-escaneadas', false)
on conflict (id) do nothing;

drop policy if exists provas_insert_own on storage.objects;
drop policy if exists provas_select_own on storage.objects;
drop policy if exists provas_delete_own on storage.objects;

create policy provas_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'provas-escaneadas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy provas_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'provas-escaneadas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy provas_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'provas-escaneadas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
