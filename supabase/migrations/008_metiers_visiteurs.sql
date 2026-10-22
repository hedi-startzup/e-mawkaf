-- Mawkaf — MAW-28 : la page d'accueil publique affiche la liste des métiers aux visiteurs
-- (non connectés). Les métiers ne sont pas des données sensibles ; seule la lecture est ouverte.
begin;

grant select on public.trades to anon;

create policy trades_select_anon on public.trades
  for select to anon using (is_active);

commit;
