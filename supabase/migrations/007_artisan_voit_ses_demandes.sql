-- Mawkaf — US08 (MAW-14) : un artisan garde la vue sur les demandes où il a fait une offre
-- Raison : « Mes offres » doit afficher la demande d'une offre refusée ou retirée,
-- même quand la demande n'est plus ouverte (attribuée à un autre, annulée…).
begin;

-- L'artisan connecté a-t-il fait une offre sur cette demande ?
create or replace function private.artisan_has_offer(p_request_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.offers o
    where o.request_id = p_request_id and o.artisan_id = (select auth.uid())
  );
$$;

revoke all on function private.artisan_has_offer(uuid) from public;
grant execute on function private.artisan_has_offer(uuid) to authenticated;

drop policy requests_select on public.requests;
create policy requests_select on public.requests
  for select to authenticated
  using (
       client_id = (select auth.uid())
    or private.artisan_can_see_request(id)
    or private.is_retained_artisan(id)
    or private.artisan_has_offer(id)
  );

commit;
