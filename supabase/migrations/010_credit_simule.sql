-- Mawkaf — US15 (MAW-22) : recharge de crédit et commission simulées (aucun argent réel)
begin;

-- Recharge simulée (US15) : 100, 200 ou 500 DH, par l'artisan connecté, sans argent réel.
-- Le crédit ne s'écrit jamais depuis l'appli : seule cette fonction l'augmente.
create or replace function public.recharger_credit(montant integer)
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  v_solde integer;
begin
  if montant not in (100, 200, 500) then
    raise exception 'Montant de recharge invalide : 100, 200 ou 500 DH.';
  end if;
  if (select role from public.profiles where id = (select auth.uid())) is distinct from 'artisan' then
    raise exception 'Seul un artisan peut recharger son crédit.';
  end if;
  insert into public.credit_movements (artisan_id, request_id, amount, kind)
  values ((select auth.uid()), null, montant, 'recharge_simulee');
  update public.profiles set credit_balance = credit_balance + montant
  where id = (select auth.uid())
  returning credit_balance into v_solde;
  return v_solde;
end;
$$;

revoke all on function public.recharger_credit(integer) from public, anon;
grant execute on function public.recharger_credit(integer) to authenticated;

-- Commission simulée de 14 % (RG13, US15) : débitée quand la demande est attribuée
-- (choisir_offre), rendue si une demande attribuée est annulée avant le jour de l'intervention (RG09).
-- Le solde peut devenir négatif (simulation).
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

  -- Remboursement seulement si l'annulation a lieu AVANT le jour de l'intervention :
  -- évite d'annuler après le travail pour récupérer la commission (litiges : lot 3)
  elsif old.status = 'attribuee' and new.status = 'annulee'
        and private.today_casablanca() < new.service_date then
    select o.artisan_id into v_artisan from public.offers o where o.id = old.accepted_offer_id;
    -- Ce qui a été débité pour cette demande et pas encore rendu
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

drop trigger if exists requests_mouvements_credit on public.requests;
create trigger requests_mouvements_credit
  after update of status on public.requests
  for each row execute function private.mouvements_credit();

commit;
