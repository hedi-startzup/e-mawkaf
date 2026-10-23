-- =====================================================================
-- Mawkaf — schéma de la base de données (US02 / MAW-8)
-- Projet Supabase : « Projet E-mawkaf » uniquement.
-- À exécuter UNE fois, sur une base vide, dans l'éditeur SQL de Supabase.
-- Tout le script s'exécute en une transaction : en cas d'erreur, rien n'est créé.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 0. Schéma privé pour les fonctions d'aide de la RLS
--    (non exposé par l'API, donc non appelable directement depuis l'appli)
-- ---------------------------------------------------------------------
create schema if not exists private;
grant usage on schema private to authenticated;

-- Date du jour à Casablanca (les demandes sont pour aujourd'hui ou demain)
create or replace function private.today_casablanca()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Africa/Casablanca')::date;
$$;

-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------

-- 1.1 trades : métiers (RG03). « Autre » = for_artisans = false.
create table public.trades (
  id           text primary key check (id ~ '^[a-z_]+$'),
  label        text not null unique,
  icon         text not null,            -- nom d'icône Lucide (lucide-react)
  is_active    boolean not null default true,
  sort_order   integer not null,
  for_artisans boolean not null default true
);

-- 1.2 profiles : un profil par compte Supabase (RG01)
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  role            text not null check (role in ('client', 'artisan')),
  full_name       text not null check (char_length(btrim(full_name)) between 1 and 100),
  city            text not null default 'Casablanca',
  district        text,
  neighborhood    text check (char_length(neighborhood) <= 60),  -- quartier libre
  trades         text[] not null default '{}',   -- identifiants de public.trades
  available_today boolean not null default true,
  credit_balance  integer not null default 0,      -- DH, peut être négatif (simulation US15)
  avatar_path     text,                            -- photo dans Storage « avatars » (US23, migration 011)
  created_at      timestamptz not null default now(),
  -- RG03 : un artisan a au plus 3 métiers (0 tant que son profil n'est pas complété, US04) ;
  -- un client n'en a aucun
  constraint profiles_trades_selon_role check (
       (role = 'artisan' and cardinality(trades) <= 3)
    or (role = 'client'  and cardinality(trades) = 0)
  ),
  -- US23 : la photo est toujours rangée dans le dossier de son propriétaire
  constraint profiles_avatar_dans_son_dossier check (avatar_path is null or avatar_path like id::text || '/%')
);

-- 1.3 contacts : téléphone, séparé du profil pour le protéger (RG02, RG08)
create table public.contacts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  phone   text not null check (phone ~ '^0[67][0-9]{8}$')
);

-- 1.4 requests : demandes des clients
create table public.requests (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.profiles (id) on delete cascade,
  trade             text not null references public.trades (id),
  description       text not null check (char_length(description) between 10 and 300),
  city              text not null,
  district          text,
  neighborhood      text check (char_length(neighborhood) <= 60),  -- quartier libre
  service_date      date not null,
  proposed_price    integer check (proposed_price between 50 and 5000),  -- NULL = demande de devis (RG04)
  status            text not null default 'ouverte'
                    check (status in ('ouverte', 'attribuee', 'terminee', 'annulee')),
  accepted_offer_id uuid,                -- clé étrangère ajoutée après la table offers
  created_at        timestamptz not null default now()
);

-- 1.5 offers : offres des artisans (RG04, RG06)
create table public.offers (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  artisan_id uuid not null references public.profiles (id) on delete cascade,
  price      integer not null check (price between 50 and 5000),
  message    text check (char_length(message) <= 140),
  status     text not null default 'en_attente'
             check (status in ('en_attente', 'acceptee', 'refusee', 'retiree')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offers_une_par_artisan unique (request_id, artisan_id)
);

alter table public.requests
  add constraint requests_accepted_offer_fk
  foreign key (accepted_offer_id) references public.offers (id) on delete set null;

-- 1.6 ratings : une note par demande terminée (RG10)
create table public.ratings (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.requests (id) on delete cascade,
  artisan_id uuid not null references public.profiles (id) on delete cascade,
  client_id  uuid not null references public.profiles (id) on delete cascade,
  score      smallint not null check (score between 1 and 5),
  comment    text check (char_length(comment) <= 200),
  created_at timestamptz not null default now()
);

-- 1.7 credit_movements : mouvements de crédit simulés (US15)
create table public.credit_movements (
  id         uuid primary key default gen_random_uuid(),
  artisan_id uuid not null references public.profiles (id) on delete cascade,
  request_id uuid references public.requests (id) on delete set null,  -- vide pour une recharge
  amount     integer not null,
  kind       text not null check (kind in ('recharge_simulee', 'commission', 'remboursement')),
  created_at timestamptz not null default now()
);

-- Index utiles aux règles RLS et aux écrans
create index requests_client_idx  on public.requests (client_id);
create index requests_feed_idx    on public.requests (status, city, service_date);
create index offers_request_idx   on public.offers (request_id);
create index offers_artisan_idx   on public.offers (artisan_id);
create index ratings_artisan_idx  on public.ratings (artisan_id);
create index credit_artisan_idx   on public.credit_movements (artisan_id);

-- ---------------------------------------------------------------------
-- 2. Déclencheurs de contrôle
-- ---------------------------------------------------------------------

-- 2.1 Les métiers d'un artisan existent, sont actifs, sans doublon, et jamais « Autre » (RG03)
create or replace function private.check_profile_trades()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if cardinality(new.trades) <> (select count(distinct t) from unnest(new.trades) as t) then
    raise exception 'Un même métier ne peut pas être choisi deux fois.';
  end if;
  if exists (
    select 1 from unnest(new.trades) as t
    where not exists (
      select 1 from public.trades tr
      where tr.id = t and tr.is_active and tr.for_artisans
    )
  ) then
    raise exception 'Métier invalide : choisissez parmi la liste des métiers proposés.';
  end if;
  return new;
end;
$$;

create trigger profiles_check_trades
  before insert or update of trades on public.profiles
  for each row execute function private.check_profile_trades();

-- 2.2 Une demande est pour aujourd'hui ou demain (heure de Casablanca)
create or replace function private.check_request_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.service_date not between private.today_casablanca()
                              and private.today_casablanca() + 1 then
    raise exception 'La date doit être aujourd''hui ou demain.';
  end if;
  return new;
end;
$$;

create trigger requests_check_insert
  before insert on public.requests
  for each row execute function private.check_request_insert();

-- 2.3 Changements de statut autorisés depuis l'appli (RG09, RG10).
--     Le passage à « attribuee » se fait uniquement par choisir_offre.
create or replace function private.check_request_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and new.status <> old.status then
    if not (
         (old.status = 'ouverte'   and new.status = 'annulee')
      or (old.status = 'attribuee' and new.status in ('annulee', 'terminee'))
    ) then
      raise exception 'Changement de statut impossible : de « % » vers « % ».', old.status, new.status;
    end if;
  end if;
  return new;
end;
$$;

create trigger requests_check_status
  before update on public.requests
  for each row execute function private.check_request_status();

-- 2.4 updated_at des offres
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger offers_set_updated_at
  before update on public.offers
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- 3. Fonctions d'aide pour la RLS (security definer : évitent les boucles
--    entre les règles de requests et d'offers)
-- ---------------------------------------------------------------------

-- Rôle de l'utilisateur connecté
create or replace function private.my_role()
returns text
language sql stable security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

-- L'utilisateur connecté est-il le client de cette demande ?
create or replace function private.is_request_client(p_request_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.requests r
    where r.id = p_request_id and r.client_id = (select auth.uid())
  );
$$;

-- L'artisan connecté peut-il voir cette demande ouverte ? (RG05, RG12)
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
      and r.city = p.city
      and (r.trade = any (p.trades) or t.for_artisans = false)    -- ses métiers + « Autre »
      and r.service_date between private.today_casablanca()
                             and private.today_casablanca() + 1
      and (p.available_today or r.service_date = private.today_casablanca() + 1)  -- RG12
  );
$$;

-- L'artisan connecté est-il l'artisan retenu de cette demande ?
create or replace function private.is_retained_artisan(p_request_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.requests r
    join public.offers o on o.id = r.accepted_offer_id
    where r.id = p_request_id and o.artisan_id = (select auth.uid())
  );
$$;

-- L'artisan connecté a-t-il fait une offre sur cette demande ? (US08, migration 007)
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

-- L'utilisateur connecté peut-il voir le téléphone de p_user_id ? (RG08)
create or replace function private.can_see_phone(p_user_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.requests r
    join public.offers o on o.id = r.accepted_offer_id
    where r.status in ('attribuee', 'terminee')
      and (
           (r.client_id  = (select auth.uid()) and o.artisan_id = p_user_id)
        or (o.artisan_id = (select auth.uid()) and r.client_id  = p_user_id)
      )
  );
$$;

-- Le client connecté peut-il noter cet artisan pour cette demande ? (RG10)
create or replace function private.can_rate(p_request_id uuid, p_artisan_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.requests r
    join public.offers o on o.id = r.accepted_offer_id
    where r.id = p_request_id
      and r.status = 'terminee'
      and r.client_id = (select auth.uid())
      and o.artisan_id = p_artisan_id
  );
$$;

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated;

-- ---------------------------------------------------------------------
-- 4. Droits sur les tables (seuls les utilisateurs connectés ont accès)
-- ---------------------------------------------------------------------
revoke all on public.trades, public.profiles, public.contacts, public.requests,
              public.offers, public.ratings, public.credit_movements
  from anon, authenticated;

grant select on public.trades to authenticated;

-- profiles : le rôle et le solde de crédit ne sont pas modifiables par l'utilisateur
grant select on public.profiles to authenticated;
grant insert (id, role, full_name, city, district, neighborhood, trades, available_today)
  on public.profiles to authenticated;
grant update (full_name, city, district, neighborhood, trades, available_today, avatar_path)
  on public.profiles to authenticated;

grant select, insert, update on public.contacts to authenticated;

-- requests : le client ne peut changer que le statut (contrôlé par 2.3)
grant select on public.requests to authenticated;
grant insert (client_id, trade, description, city, district, neighborhood, service_date, proposed_price)
  on public.requests to authenticated;
grant update (status) on public.requests to authenticated;

-- offers : l'artisan peut modifier prix, message, et retirer / remettre son offre
grant select on public.offers to authenticated;
grant insert (request_id, artisan_id, price, message) on public.offers to authenticated;
grant update (price, message, status) on public.offers to authenticated;

grant select on public.ratings to authenticated;
grant insert (request_id, artisan_id, client_id, score, comment) on public.ratings to authenticated;

grant select on public.credit_movements to authenticated;   -- aucune écriture depuis l'appli

-- ---------------------------------------------------------------------
-- 5. Sécurité au niveau des lignes (RLS)
-- ---------------------------------------------------------------------
alter table public.trades           enable row level security;
alter table public.profiles         enable row level security;
alter table public.contacts         enable row level security;
alter table public.requests         enable row level security;
alter table public.offers           enable row level security;
alter table public.ratings          enable row level security;
alter table public.credit_movements enable row level security;

-- trades : lecture pour tout utilisateur connecté ; écriture par le tableau de bord seulement
create policy trades_select on public.trades
  for select to authenticated using (true);
-- Les visiteurs voient les métiers actifs sur la page d'accueil (migration 008)
grant select on public.trades to anon;
create policy trades_select_anon on public.trades
  for select to anon using (is_active);

-- profiles
create policy profiles_select on public.profiles
  for select to authenticated using (true);
create policy profiles_insert on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- contacts (RG08)
create policy contacts_select on public.contacts
  for select to authenticated
  using (user_id = (select auth.uid()) or private.can_see_phone(user_id));
create policy contacts_insert on public.contacts
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy contacts_update on public.contacts
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- requests
create policy requests_select on public.requests
  for select to authenticated
  using (
       client_id = (select auth.uid())
    or private.artisan_can_see_request(id)
    or private.is_retained_artisan(id)
    or private.artisan_has_offer(id)       -- US08 (migration 007) : « Mes offres »
  );
create policy requests_insert on public.requests
  for insert to authenticated
  with check (client_id = (select auth.uid()) and private.my_role() = 'client');
create policy requests_update on public.requests
  for update to authenticated
  using (client_id = (select auth.uid())) with check (client_id = (select auth.uid()));

-- offers (RG06, RG07)
create policy offers_select on public.offers
  for select to authenticated
  using (artisan_id = (select auth.uid()) or private.is_request_client(request_id));
create policy offers_insert on public.offers
  for insert to authenticated
  with check (
    artisan_id = (select auth.uid())
    and private.artisan_can_see_request(request_id)   -- demande ouverte et visible
    and exists (                                      -- US23 : pas de photo, pas d'offre
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.avatar_path is not null
    )
  );
create policy offers_update on public.offers
  for update to authenticated
  using (
    artisan_id = (select auth.uid())
    and exists (select 1 from public.requests r
                where r.id = request_id and r.status = 'ouverte')
  )
  with check (
    artisan_id = (select auth.uid())
    and status in ('en_attente', 'retiree')
  );

-- ratings (RG10)
create policy ratings_select on public.ratings
  for select to authenticated using (true);
create policy ratings_insert on public.ratings
  for insert to authenticated
  with check (client_id = (select auth.uid()) and private.can_rate(request_id, artisan_id));

-- credit_movements : lecture par l'artisan concerné ; aucune écriture depuis l'appli
create policy credit_movements_select on public.credit_movements
  for select to authenticated using (artisan_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- 6. Fonction choisir_offre (RG07) : tout ou rien, en une seule opération
-- ---------------------------------------------------------------------
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
begin
  select o.request_id into v_request_id
  from public.offers o where o.id = choisir_offre.offer_id;
  if v_request_id is null then
    raise exception 'Offre introuvable.';
  end if;

  -- Verrouille la demande pour éviter deux choix simultanés
  select r.client_id, r.status into v_client_id, v_req_status
  from public.requests r where r.id = v_request_id
  for update;

  if v_client_id is distinct from auth.uid() then
    raise exception 'Seul le client de la demande peut choisir une offre.';
  end if;
  if v_req_status <> 'ouverte' then
    raise exception 'Cette demande n''est plus ouverte.';
  end if;

  select o.status into v_offer_status
  from public.offers o where o.id = choisir_offre.offer_id
  for update;
  if v_offer_status <> 'en_attente' then
    raise exception 'Cette offre n''est plus disponible.';
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

-- ---------------------------------------------------------------------
-- 7. Vue artisan_ratings (RG11) : moyenne arrondie au dixième + nombre d'avis
--    Un artisan sans ligne dans la vue = « Nouveau » (géré par l'interface)
-- ---------------------------------------------------------------------
create view public.artisan_ratings
with (security_invoker = true) as
select
  artisan_id,
  round(avg(score)::numeric, 1) as average_score,
  count(*)::integer             as ratings_count
from public.ratings
group by artisan_id;

revoke all on public.artisan_ratings from anon;
grant select on public.artisan_ratings to authenticated;

-- ---------------------------------------------------------------------
-- 7 bis. Fonction nombre_offres (US07, migration 006)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 7 ter. Crédit simulé : recharge et commission (US15, migration 010)
-- ---------------------------------------------------------------------
-- Recharge simulée (US15) : montant libre en DH entiers, de 50 à 5 000 (comme RG04), par l'artisan connecté, sans argent réel.
-- Le crédit ne s'écrit jamais depuis l'appli : seule cette fonction l'augmente.
create or replace function public.recharger_credit(montant integer)
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  v_solde integer;
begin
  if montant is null or montant < 50 or montant > 5000 then
    raise exception 'Montant de recharge invalide : entre 50 et 5 000 DH.';
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

-- ---------------------------------------------------------------------
-- 8. Realtime sur offers et requests (US10)
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.offers, public.requests;

-- ---------------------------------------------------------------------
-- 9. Les 12 métiers de lancement + « Autre » (icônes Lucide)
-- ---------------------------------------------------------------------
insert into public.trades (id, label, icon, sort_order, for_artisans) values
  ('plomberie',      'Plomberie',                  'wrench',          1,  true),
  ('electricite',    'Électricité',                'zap',             2,  true),
  ('peinture',       'Peinture',                   'paintbrush',      3,  true),
  ('maconnerie',     'Maçonnerie',                 'brick-wall',      4,  true),
  ('carrelage',      'Carrelage',                  'grid-3x3',        5,  true),
  ('menuiserie',     'Menuiserie',                 'hammer',          6,  true),
  ('climatisation',  'Climatisation',              'snowflake',       7,  true),
  ('menage',         'Ménage',                     'sparkles',        8,  true),
  ('jardinage',      'Jardinage',                  'sprout',          9,  true),
  ('serrurerie',     'Serrurerie',                 'key-round',       10, true),
  ('electromenager', 'Électroménager',             'refrigerator',    11, true),
  ('demenagement',   'Déménagement et manutention','truck',           12, true),
  ('autre',          'Autre',                      'circle-help',     99, false);


-- ---------------------------------------------------------------------
-- 10. Messagerie client / artisan retenu (migration 009, maquette n°8)
--     Même règle que le téléphone (RG08) : après attribution seulement ;
--     écriture tant que la demande est attribuée, lecture seule une fois terminée.
-- ---------------------------------------------------------------------
create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index messages_request_idx on public.messages (request_id, created_at);

-- L'utilisateur connecté est-il le client ou l'artisan retenu d'une demande attribuée ou terminée ?
create or replace function private.can_read_messages(p_request_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.requests r
    join public.offers o on o.id = r.accepted_offer_id
    where r.id = p_request_id
      and r.status in ('attribuee', 'terminee')
      and (r.client_id = (select auth.uid()) or o.artisan_id = (select auth.uid()))
  );
$$;

-- Même chose, mais seulement tant que la demande est attribuée
create or replace function private.can_write_messages(p_request_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.requests r
    join public.offers o on o.id = r.accepted_offer_id
    where r.id = p_request_id
      and r.status = 'attribuee'
      and (r.client_id = (select auth.uid()) or o.artisan_id = (select auth.uid()))
  );
$$;

revoke all on function private.can_read_messages(uuid), private.can_write_messages(uuid) from public;
grant execute on function private.can_read_messages(uuid), private.can_write_messages(uuid) to authenticated;

-- Droits : lecture et envoi seulement ; aucun message ne se modifie ni ne se supprime
revoke all on public.messages from anon, authenticated;
grant select on public.messages to authenticated;
grant insert (request_id, sender_id, body) on public.messages to authenticated;

alter table public.messages enable row level security;

create policy messages_select on public.messages
  for select to authenticated
  using (private.can_read_messages(request_id));
create policy messages_insert on public.messages
  for insert to authenticated
  with check (sender_id = (select auth.uid()) and private.can_write_messages(request_id));

-- Realtime : les nouveaux messages s'affichent sans recharger (la RLS s'applique aussi au Realtime)
alter publication supabase_realtime add table public.messages;

commit;

-- =====================================================================
-- US23 (migration 011) : photos de profil dans Supabase Storage
-- Espace « avatars » privé : lisible par les utilisateurs connectés, chacun ne dépose que la sienne.
-- =====================================================================
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 1048576, array['image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

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

commit;
