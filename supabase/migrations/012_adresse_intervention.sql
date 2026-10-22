-- Mawkaf — US26 (MAW-36) : adresse d'intervention. Validé par Hedi le 22/10/2026.
-- Le client enregistre son adresse « Maison » (lui seul la lit) ; à chaque demande il choisit
-- « Maison » ou « Autre adresse ». L'adresse de la demande n'est lisible que par le client et
-- l'artisan retenu, après attribution : même règle que le téléphone (RG08), garantie par la base.
begin;

-- 1. Adresse « Maison » du client : privée
create table public.client_addresses (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  address text not null check (char_length(btrim(address)) between 5 and 200)
);

-- 2. Adresse exacte de chaque demande
create table public.request_addresses (
  request_id uuid primary key references public.requests (id) on delete cascade,
  address    text not null check (char_length(btrim(address)) between 5 and 200)
);

-- L'artisan connecté est-il l'artisan retenu d'une demande attribuée ou terminée ?
create or replace function private.can_see_request_address(p_request_id uuid)
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
      and o.artisan_id = (select auth.uid())
  );
$$;

revoke all on function private.can_see_request_address(uuid) from public;
grant execute on function private.can_see_request_address(uuid) to authenticated;

revoke all on public.client_addresses, public.request_addresses from anon, authenticated;
grant select, insert, update on public.client_addresses to authenticated;
grant select, insert on public.request_addresses to authenticated;

alter table public.client_addresses  enable row level security;
alter table public.request_addresses enable row level security;

create policy client_addresses_select on public.client_addresses
  for select to authenticated using (user_id = (select auth.uid()));
create policy client_addresses_insert on public.client_addresses
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy client_addresses_update on public.client_addresses
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Le client écrit l'adresse de sa demande (à la publication) ; il la lit, et l'artisan retenu
-- la lit après attribution. Les autres artisans ne la voient jamais.
create policy request_addresses_select on public.request_addresses
  for select to authenticated
  using (private.is_request_client(request_id) or private.can_see_request_address(request_id));
create policy request_addresses_insert on public.request_addresses
  for insert to authenticated
  with check (private.is_request_client(request_id));

commit;
