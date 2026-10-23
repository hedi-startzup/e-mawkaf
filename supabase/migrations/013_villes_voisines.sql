-- Mawkaf — US27 (MAW-37) : zone de déplacement de l'artisan (villes voisines). Validé par Hedi le 22/10/2026.
-- Version simple, sans carte ni kilomètres : l'artisan coche jusqu'à 5 autres villes où il accepte d'aller.
-- RG05 devient : sa ville OU une de ses villes voisines. Les autres règles ne changent pas.
begin;

alter table public.profiles
  add column if not exists nearby_cities text[] not null default '{}'
  constraint profiles_villes_voisines_max check (cardinality(nearby_cities) <= 5);

grant update (nearby_cities) on public.profiles to authenticated;

-- L'artisan connecté peut-il voir cette demande ouverte ? (RG05, RG12, US27)
create or replace function private.artisan_can_see_request(p_request_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.requests r
    join public.trades   t on t.id = r.trade
    join public.profiles p on p.id = (select auth.uid())
    where r.id = p_request_id
      and r.status = 'ouverte'
      and p.role = 'artisan'
      and (r.city = p.city or r.city = any (p.nearby_cities))     -- sa ville + ses villes voisines (US27)
      and (r.trade = any (p.trades) or t.for_artisans = false)    -- ses métiers + « Autre »
      and r.service_date between private.today_casablanca()
                             and private.today_casablanca() + 1
      and (p.available_today or r.service_date = private.today_casablanca() + 1)  -- RG12
  );
$$;

commit;
