-- Mawkaf — US25 (MAW-35, migration 016) : signaler et traiter un litige. Validé par Hedi le 23/10/2026.
-- Le client ou l'artisan retenu d'une demande attribuée ou terminée ouvre un litige (un par demande).
-- Les deux parties voient son statut ; seuls les admins (private.admins, US24) le traitent.
-- Un litige non résolu bloque le remboursement automatique de la commission (US15) ;
-- l'admin peut rembourser la commission lui-même.
begin;

create table public.disputes (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null unique references public.requests (id) on delete cascade,
  opened_by   uuid not null references public.profiles (id) on delete cascade,
  reason      text not null check (reason in ('travail_non_fait', 'client_absent', 'paiement_refuse', 'annulation_abusive', 'autre')),
  description text not null check (char_length(btrim(description)) between 10 and 300),
  status      text not null default 'ouvert' check (status in ('ouvert', 'en_cours', 'resolu')),
  admin_note  text check (char_length(admin_note) <= 300),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- L'utilisateur connecté est-il le client ou l'artisan retenu d'une demande attribuée ou terminée ?
create or replace function private.is_request_party(p_request_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.requests r
    left join public.offers o on o.id = r.accepted_offer_id
    where r.id = p_request_id
      and r.status in ('attribuee', 'terminee')
      and (r.client_id = (select auth.uid()) or o.artisan_id = (select auth.uid()))
  );
$$;

revoke all on function private.is_request_party(uuid) from public;
grant execute on function private.is_request_party(uuid) to authenticated;

-- Les parties lisent et ouvrent ; personne ne modifie depuis l'appli (le traitement passe par les fonctions admin)
revoke all on public.disputes from anon, authenticated;
grant select on public.disputes to authenticated;
grant insert (request_id, opened_by, reason, description) on public.disputes to authenticated;

alter table public.disputes enable row level security;

create policy disputes_select on public.disputes
  for select to authenticated
  using (private.is_request_party(request_id) or private.is_admin());
create policy disputes_insert on public.disputes
  for insert to authenticated
  with check (opened_by = (select auth.uid()) and private.is_request_party(request_id));

-- Remboursement automatique de la commission : bloqué tant qu'un litige n'est pas résolu
create or replace function private.mouvements_credit()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_artisan    uuid;
  v_prix       integer;
  v_commission integer;
  v_net        integer;
begin
  if old.status = 'ouverte' and new.status = 'attribuee' and new.accepted_offer_id is not null then
    select o.artisan_id, o.price into v_artisan, v_prix
    from public.offers o where o.id = new.accepted_offer_id;
    v_commission := round(v_prix * 0.14)::integer;
    insert into public.credit_movements (artisan_id, request_id, amount, kind)
    values (v_artisan, new.id, -v_commission, 'commission');
    update public.profiles set credit_balance = credit_balance - v_commission where id = v_artisan;

  -- Remboursement seulement si l'annulation a lieu AVANT le jour de l'intervention,
  -- et s'il n'y a pas de litige en attente (US25) : c'est alors l'admin qui tranche
  elsif old.status = 'attribuee' and new.status = 'annulee'
        and private.today_casablanca() < new.service_date
        and not exists (select 1 from public.disputes d where d.request_id = new.id and d.status <> 'resolu') then
    select o.artisan_id into v_artisan from public.offers o where o.id = old.accepted_offer_id;
    select coalesce(sum(m.amount), 0) into v_net
    from public.credit_movements m
    where m.request_id = new.id and m.artisan_id = v_artisan
      and m.kind in ('commission', 'remboursement');
    if v_net < 0 then
      insert into public.credit_movements (artisan_id, request_id, amount, kind)
      values (v_artisan, new.id, -v_net, 'remboursement');
      update public.profiles set credit_balance = credit_balance - v_net where id = v_artisan;
    end if;
  end if;
  return new;
end;
$$;

-- Admin : liste des litiges, les plus récents d'abord (ni téléphone ni adresse, RG08)
create or replace function public.litiges_admin()
returns json
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Accès réservé aux administrateurs.' using errcode = '42501';
  end if;
  return (
    select coalesce(json_agg(l order by l.created_at desc), '[]'::json) from (
      select d.id, d.reason, d.description, d.status, d.admin_note, d.created_at,
             p.full_name as ouvert_par, p.role as role_ouvreur,
             t.label as metier, r.city as ville, r.status as statut_demande,
             (select coalesce(-sum(m.amount), 0) from public.credit_movements m
               where m.request_id = r.id and m.kind in ('commission', 'remboursement')) as commission_retenue
      from public.disputes d
      join public.profiles p on p.id = d.opened_by
      join public.requests r on r.id = d.request_id
      join public.trades t on t.id = r.trade
    ) l
  );
end;
$$;

-- Admin : changer le statut d'un litige, avec une note facultative
create or replace function public.traiter_litige(p_litige uuid, p_statut text, p_note text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Accès réservé aux administrateurs.' using errcode = '42501';
  end if;
  if p_statut not in ('ouvert', 'en_cours', 'resolu') then
    raise exception 'Statut inconnu.';
  end if;
  update public.disputes
     set status = p_statut,
         admin_note = coalesce(nullif(btrim(p_note), ''), admin_note),
         updated_at = now()
   where id = p_litige;
end;
$$;

-- Admin : rendre à l'artisan la commission encore retenue pour la demande du litige
create or replace function public.rembourser_litige(p_litige uuid)
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  v_request uuid;
  v_artisan uuid;
  v_net     integer;
begin
  if not private.is_admin() then
    raise exception 'Accès réservé aux administrateurs.' using errcode = '42501';
  end if;
  select d.request_id into v_request from public.disputes d where d.id = p_litige;
  select o.artisan_id into v_artisan
  from public.requests r join public.offers o on o.id = r.accepted_offer_id
  where r.id = v_request;
  select coalesce(sum(m.amount), 0) into v_net
  from public.credit_movements m
  where m.request_id = v_request and m.artisan_id = v_artisan
    and m.kind in ('commission', 'remboursement');
  if v_net < 0 then
    insert into public.credit_movements (artisan_id, request_id, amount, kind)
    values (v_artisan, v_request, -v_net, 'remboursement');
    update public.profiles set credit_balance = credit_balance - v_net where id = v_artisan;
    return -v_net;
  end if;
  return 0;
end;
$$;

revoke all on function public.litiges_admin(), public.traiter_litige(uuid, text, text), public.rembourser_litige(uuid) from public, anon;
grant execute on function public.litiges_admin(), public.traiter_litige(uuid, text, text), public.rembourser_litige(uuid) to authenticated;

commit;
