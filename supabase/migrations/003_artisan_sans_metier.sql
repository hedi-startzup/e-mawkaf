-- Mawkaf — US02 (MAW-8) : un artisan peut exister sans métier (0 à 3)
-- Raison : US04 prévoit « un artisan sans métier voit un message l'invitant
-- à compléter son profil ». L'inscription (US03) ne demande pas les métiers.
begin;

alter table public.profiles drop constraint profiles_trades_selon_role;
alter table public.profiles add constraint profiles_trades_selon_role check (
     (role = 'artisan' and cardinality(trades) <= 3)
  or (role = 'client'  and cardinality(trades) = 0)
);

commit;
