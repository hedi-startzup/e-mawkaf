import { supabase } from './supabase'

// Adresse d'intervention (US26). L'adresse « Maison » n'est lisible que par le client ;
// l'adresse d'une demande, par le client et l'artisan retenu après attribution (RLS, comme RG08).

export const ADRESSE_MIN = 5
export const ADRESSE_MAX = 200

export function erreurAdresse(valeur) {
  const longueur = (valeur ?? '').trim().length
  if (longueur === 0) return "Adresse : indiquez la rue, le numéro et l'étage, pour que l'artisan vous trouve."
  if (longueur < ADRESSE_MIN) return `Adresse : ${ADRESSE_MIN} caractères au moins (rue, numéro, immeuble, étage).`
  if (longueur > ADRESSE_MAX) return `Adresse : ${ADRESSE_MAX} caractères au maximum.`
  return null
}

export async function chargerAdresseMaison(idClient) {
  const { data, error } = await supabase.from('client_addresses').select('address').eq('user_id', idClient).maybeSingle()
  if (error) return { erreur: 'Impossible de charger votre adresse. Rechargez la page.' }
  return { adresse: data?.address ?? '' }
}

export async function enregistrerAdresseMaison(idClient, adresse) {
  const { error } = await supabase
    .from('client_addresses')
    .upsert({ user_id: idClient, address: adresse.trim() }, { onConflict: 'user_id' })
  return error ? { erreur: "Votre adresse n'a pas pu être enregistrée. Réessayez dans un instant." } : {}
}

// Adresse d'une demande : null si la base ne la montre pas (demande pas encore attribuée)
export async function chargerAdresseDemande(idDemande) {
  const { data } = await supabase.from('request_addresses').select('address').eq('request_id', idDemande).maybeSingle()
  return data?.address ?? null
}

// Lien vers une application de cartes (Google Maps s'ouvre aussi sur iPhone et Android)
export function lienCarte(adresse, ville) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([adresse, ville, 'Maroc'].filter(Boolean).join(', '))}`
}
