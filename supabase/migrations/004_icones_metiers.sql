-- Mawkaf — US02 (MAW-8) : icônes des métiers alignées sur la maquette (Lucide)
begin;
update public.trades set icon = 'paintbrush'   where id = 'peinture';
update public.trades set icon = 'snowflake'    where id = 'climatisation';
update public.trades set icon = 'sparkles'     where id = 'menage';
update public.trades set icon = 'refrigerator' where id = 'electromenager';
update public.trades set icon = 'circle-help'  where id = 'autre';
commit;
