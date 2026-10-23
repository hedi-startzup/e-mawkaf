import { supabase } from './supabase'

// Litiges (US25) : ouverts par le client ou l'artisan retenu d'une demande attribuée ou terminée,
// un par demande, traités par les admins. La base vérifie qui peut lire, ouvrir et traiter (RLS).

export const DESCRIPTION_LITIGE_MIN = 10
export const DESCRIPTION_LITIGE_MAX = 300

export const MOTIFS_LITIGE = {
  travail_non_fait: 'Travail non fait ou mal fait',
  client_absent: 'Client absent',
  paiement_refuse: 'Paiement refusé',
  annulation_abusive: 'Annulation abusive',
  autre: 'Autre',
}

export const STATUTS_LITIGE = {
  ouvert: { label: 'Litige ouvert', classes: 'bg-danger/10 text-danger' },
  en_cours: { label: 'Litige en cours de traitement', classes: 'bg-sand text-brand-dark' },
  resolu: { label: 'Litige résolu', classes: 'bg-ok-light text-ok' },
}

export function erreurDescriptionLitige(texte) {
  const longueur = (texte ?? '').trim().length
  if (longueur < DESCRIPTION_LITIGE_MIN) {
    return `Description : expliquez le problème en ${DESCRIPTION_LITIGE_MIN} caractères au moins.`
  }
  if (longueur > DESCRIPTION_LITIGE_MAX) return `Description : ${DESCRIPTION_LITIGE_MAX} caractères au maximum.`
  return null
}

// Le litige d'une demande, s'il y en a un (null sinon)
export async function chargerLitige(idDemande) {
  const { data, error } = await supabase
    .from('disputes')
    .select('id, reason, description, status, admin_note, opened_by, created_at')
    .eq('request_id', idDemande)
    .maybeSingle()
  if (error) return { erreur: 'Impossible de charger le litige. Rechargez la page.' }
  return { litige: data }
}

export async function ouvrirLitige({ idDemande, idUtilisateur, motif, description }) {
  const { error } = await supabase.from('disputes').insert({
    request_id: idDemande,
    opened_by: idUtilisateur,
    reason: motif,
    description: description.trim(),
  })
  if (!error) return {}
  if (error.code === '23505') return { erreur: 'Un litige est déjà ouvert pour cette demande. Rechargez la page.' }
  if (error.code === '42501') return { erreur: 'Vous ne pouvez pas ouvrir de litige sur cette demande.' }
  return { erreur: "Le litige n'a pas pu être envoyé. Vérifiez votre connexion et réessayez." }
}

// --- Admin (page /admin) ---

export async function chargerLitigesAdmin() {
  const { data, error } = await supabase.rpc('litiges_admin')
  if (error) return { erreur: 'Impossible de charger les litiges. Rechargez la page.' }
  return { litiges: data ?? [] }
}

export async function traiterLitige(idLitige, statut, note) {
  const { error } = await supabase.rpc('traiter_litige', { p_litige: idLitige, p_statut: statut, p_note: note || null })
  return error ? { erreur: "Le litige n'a pas pu être mis à jour. Réessayez." } : {}
}

export async function rembourserLitige(idLitige) {
  const { data, error } = await supabase.rpc('rembourser_litige', { p_litige: idLitige })
  return error ? { erreur: "La commission n'a pas pu être remboursée. Réessayez." } : { montant: data ?? 0 }
}
