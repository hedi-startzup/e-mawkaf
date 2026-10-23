-- Mawkaf — US23 (MAW-31) : photo de profil, obligatoire pour l'artisan, facultative pour le client.
-- Ajout validé par Hedi le 22/10/2026 (CLAUDE.md la classait en lot 3).
-- Les photos sont rangées dans Supabase Storage (espace « avatars », privé) :
-- lisibles par les utilisateurs connectés seulement, chacun ne dépose que la sienne.
begin;

-- 1. Chemin de la photo dans Storage, toujours dans le dossier de son propriétaire (« <id>/… »)
alter table public.profiles
  add column if not exists avatar_path text
  constraint profiles_avatar_dans_son_dossier
    check (avatar_path is null or avatar_path like id::text || '/%');

grant update (avatar_path) on public.profiles to authenticated;

-- 2. Espace de rangement : privé, JPEG ou PNG, 1 Mo au plus
--    (la photo est recadrée et réduite dans le navigateur avant l'envoi)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 1048576, array['image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_select on storage.objects;
drop policy if exists avatars_insert on storage.objects;
drop policy if exists avatars_update on storage.objects;
drop policy if exists avatars_delete on storage.objects;

create policy avatars_select on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars');
create policy avatars_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 3. Pas de photo, pas d'offre : garanti par la base, pas seulement par l'écran
drop policy if exists offers_insert on public.offers;
create policy offers_insert on public.offers
  for insert to authenticated
  with check (
    artisan_id = (select auth.uid())
    and private.artisan_can_see_request(request_id)   -- demande ouverte et visible
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.avatar_path is not null
    )
  );

commit;
