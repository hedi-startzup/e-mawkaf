-- Mawkaf — MAW-28 : messagerie entre le client et l'artisan retenu (maquette n°8, validé par Hedi)
-- Même règle que le téléphone (RG08) : seulement entre le client et l'artisan retenu, après attribution.
-- On peut écrire tant que la demande est attribuée, seulement relire une fois terminée.
-- Rien n'est lisible pour une demande ouverte ou annulée.
begin;

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
