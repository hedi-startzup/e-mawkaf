-- Mawkaf — US02 (MAW-8) : quartier en texte libre (facultatif)
-- district = arrondissement (liste officielle dans src/lib/quartiers.js)
-- neighborhood = quartier précis saisi librement
begin;

alter table public.profiles
  add column neighborhood text check (char_length(neighborhood) <= 60);
alter table public.requests
  add column neighborhood text check (char_length(neighborhood) <= 60);

grant insert (neighborhood), update (neighborhood) on public.profiles to authenticated;
grant insert (neighborhood) on public.requests to authenticated;

commit;
