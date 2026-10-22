-- Mawkaf — US07 (MAW-13) : nombre d'offres par demande pour le fil de l'artisan
begin;

-- Nombre d'offres reçues par demande (US07), sans exposer les offres elles-mêmes :
-- un artisan ne peut pas lire les offres des autres (RLS de offers), seulement leur nombre,
-- et seulement pour les demandes qu'il a le droit de voir. Les offres retirées ne comptent pas.
create or replace function public.nombre_offres(p_request_ids uuid[])
returns table (request_id uuid, nb_offres integer)
language sql stable security definer
set search_path = ''
as $$
  select r.id, count(o.id)::integer
  from public.requests r
  left join public.offers o on o.request_id = r.id and o.status <> 'retiree'
  where r.id = any (p_request_ids)
    and (   r.client_id = (select auth.uid())
         or private.artisan_can_see_request(r.id)
         or private.is_retained_artisan(r.id))
  group by r.id;
$$;

revoke all on function public.nombre_offres(uuid[]) from public, anon;
grant execute on function public.nombre_offres(uuid[]) to authenticated;

commit;
