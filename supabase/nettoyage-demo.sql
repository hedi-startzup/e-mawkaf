-- =====================================================================
-- Mawkaf — nettoyage des comptes de test et de démo (US13 / MAW-19)
-- À coller dans Supabase → SQL Editor → Run, par un membre de l'équipe.
--
-- Supprime les comptes dont l'e-mail finit par @mawkaf.test, et les comptes
-- de test créés par téléphone avec un numéro fictif en 06 99 ou 06 00.
-- Leurs profils, téléphones, demandes, offres et notes sont supprimés avec eux
-- (« on delete cascade »). Les métiers (trades) ne sont pas touchés.
--
-- ⚠️ Irréversible. Lancer d'abord l'étape 1 seule pour vérifier la liste.
-- =====================================================================

-- Étape 1 : voir les comptes qui seront supprimés
select id, email, phone, raw_user_meta_data ->> 'full_name' as nom, created_at
from auth.users
where email like '%@mawkaf.test'
   or phone like '2126990%'
   or phone like '2126000%'
order by created_at;

-- Étape 2 : supprimer (retirer les deux tirets « -- » devant les 4 lignes ci-dessous, puis Run)
-- delete from auth.users
-- where email like '%@mawkaf.test'
--    or phone like '2126990%'
--    or phone like '2126000%';
