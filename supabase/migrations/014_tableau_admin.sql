-- Mawkaf — US24 partie 1 (MAW-34) : tableau de bord administrateur, en lecture seule.
-- Validé par Hedi le 23/10/2026. Les admins sont listés dans une table privée (non exposée par l'API) :
-- ils gardent leur compte client ou artisan (RG01 inchangée). Aucune action d'admin ici (partie 2).
-- Aucun téléphone ni aucune adresse n'est renvoyé (RG08).
begin;

-- Liste des administrateurs : se remplit uniquement depuis le SQL Editor de Supabase
create table if not exists private.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
revoke all on private.admins from public, anon, authenticated;
alter table private.admins enable row level security; -- aucune règle : personne ne la lit depuis l'appli

create or replace function private.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from private.admins a where a.user_id = (select auth.uid()));
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

-- L'utilisateur connecté est-il admin ? (pour afficher ou non la page)
create or replace function public.est_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select private.is_admin();
$$;

revoke all on function public.est_admin() from public, anon;
grant execute on function public.est_admin() to authenticated;

-- Chiffres du tableau de bord : refusé à tout autre compte qu'un admin
create or replace function public.tableau_admin()
returns json
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Accès réservé aux administrateurs.' using errcode = '42501';
  end if;

  return json_build_object(
    'clients',     (select count(*) from public.profiles where role = 'client'),
    'artisans',    (select count(*) from public.profiles where role = 'artisan'),
    'demandes',    (select coalesce(json_object_agg(status, nb), '{}'::json)
                      from (select status, count(*) as nb from public.requests group by status) s),
    'offres',      (select count(*) from public.offers),
    'commissions', (select coalesce(-sum(amount), 0) from public.credit_movements
                      where kind in ('commission', 'remboursement')),
    'note_moyenne', (select round(avg(score)::numeric, 1) from public.ratings),
    'nb_avis',     (select count(*) from public.ratings),
    'dernieres_demandes', (
      select coalesce(json_agg(d), '[]'::json) from (
        select r.created_at, t.label as metier, r.city as ville, r.status, r.proposed_price as prix
        from public.requests r join public.trades t on t.id = r.trade
        order by r.created_at desc limit 10
      ) d),
    'meilleurs_artisans', (
      select coalesce(json_agg(a), '[]'::json) from (
        select p.full_name as nom, round(avg(g.score)::numeric, 1) as note, count(*) as avis
        from public.ratings g join public.profiles p on p.id = g.artisan_id
        group by p.full_name, g.artisan_id
        order by avg(g.score) desc, count(*) desc limit 5
      ) a)
  );
end;
$$;

revoke all on function public.tableau_admin() from public, anon;
grant execute on function public.tableau_admin() to authenticated;

commit;
