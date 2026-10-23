-- Mawkaf — US20 (MAW-27) : créneau de la demande (matin, après-midi, soir).
-- Lot 2, idée de l'équipe pendant l'US08. Un vrai calendrier (heures précises) reste en lot 3.
begin;

-- 1. Créneau choisi par le client à la publication (US05).
--    Les demandes publiées avant US20 n'en ont pas (vide) : l'appli le rend obligatoire ensuite.
alter table public.requests
  add column if not exists time_slot text
  constraint requests_time_slot_valide check (time_slot in ('matin', 'apres_midi', 'soir'));

grant insert (time_slot) on public.requests to authenticated;

-- 2. choisir_offre (RG07) refuse de retenir un artisan déjà retenu sur une autre demande
--    attribuée du même jour et du même créneau. Le reste de la fonction est inchangé.
create or replace function public.choisir_offre(offer_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request_id   uuid;
  v_client_id    uuid;
  v_req_status   text;
  v_offer_status text;
  v_artisan_id   uuid;
  v_date         date;
  v_creneau      text;
begin
  select o.request_id into v_request_id
  from public.offers o where o.id = choisir_offre.offer_id;
  if v_request_id is null then
    raise exception 'Offre introuvable.';
  end if;

  -- Verrouille la demande pour éviter deux choix simultanés
  select r.client_id, r.status, r.service_date, r.time_slot
    into v_client_id, v_req_status, v_date, v_creneau
  from public.requests r where r.id = v_request_id
  for update;

  if v_client_id is distinct from auth.uid() then
    raise exception 'Seul le client de la demande peut choisir une offre.';
  end if;
  if v_req_status <> 'ouverte' then
    raise exception 'Cette demande n''est plus ouverte.';
  end if;

  select o.status, o.artisan_id into v_offer_status, v_artisan_id
  from public.offers o where o.id = choisir_offre.offer_id
  for update;
  if v_offer_status <> 'en_attente' then
    raise exception 'Cette offre n''est plus disponible.';
  end if;

  -- US20 : un artisan n'est pas retenu deux fois sur le même jour et le même créneau
  if v_creneau is not null and exists (
    select 1
    from public.requests r
    join public.offers o on o.id = r.accepted_offer_id
    where r.id <> v_request_id
      and r.status = 'attribuee'
      and r.service_date = v_date
      and r.time_slot = v_creneau
      and o.artisan_id = v_artisan_id
  ) then
    raise exception 'Artisan déjà retenu sur ce créneau.';
  end if;

  update public.requests
     set status = 'attribuee', accepted_offer_id = choisir_offre.offer_id
   where id = v_request_id;

  update public.offers
     set status = 'acceptee'
   where id = choisir_offre.offer_id;

  -- Les autres offres en attente sont refusées (les offres retirées restent « retiree »)
  update public.offers
     set status = 'refusee'
   where request_id = v_request_id
     and id <> choisir_offre.offer_id
     and status = 'en_attente';
end;
$$;

revoke all on function public.choisir_offre(uuid) from public, anon;
grant execute on function public.choisir_offre(uuid) to authenticated;

commit;
