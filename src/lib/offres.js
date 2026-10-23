import { supabase } from './supabase'

// Offres des artisans (US08). La base vérifie aussi les règles :
// une offre par artisan et par demande, prix 50–5 000 DH, modification seulement
// tant que la demande est ouverte (RG04, RG06).

export const STATUTS_OFFRE = {
  en_attente: { label: 'En attente', classes: 'bg-brand-light text-brand' },
  acceptee: { label: 'Acceptée', classes: 'bg-ok-light text-ok' },
  refusee: { label: 'Refusée', classes: 'bg-danger/10 text-danger' },
  retiree: { label: 'Retirée', classes: 'bg-gray-light text-muted' },
}

const COLONNES_DEMANDE =
  'id, client_id, trade, description, city, district, neighborhood, service_date, proposed_price, status, created_at, metier:trades(label, icon)'

// Traduit les erreurs de la base : jamais de message technique brut à l'écran.
function messageErreur(error) {
  if (error?.code === '23505') return 'Vous avez déjà fait une offre sur cette demande. Rechargez la page.'
  if (error?.code === '42501') return "Cette demande n'est plus ouverte : vous ne pouvez plus faire ou modifier d'offre."
  if (error?.code === '23514') return 'Prix : un nombre entier entre 50 et 5 000 DH.'
  return "Votre offre n'a pas pu être enregistrée. Vérifiez votre connexion et réessayez."
}

// Une demande, l'offre de l'artisan connecté (s'il en a une) et le nombre d'offres reçues
export async function chargerDemandeEtMonOffre(idDemande, idArtisan) {
  const [demande, offre, comptes] = await Promise.all([
    supabase.from('requests').select(COLONNES_DEMANDE).eq('id', idDemande).maybeSingle(),
    supabase
      .from('offers')
      .select('id, price, message, status, updated_at')
      .eq('request_id', idDemande)
      .eq('artisan_id', idArtisan)
      .maybeSingle(),
    supabase.rpc('nombre_offres', { p_request_ids: [idDemande] }),
  ])
  if (demande.error || offre.error) return { erreur: 'Impossible de charger la demande. Rechargez la page.' }
  if (!demande.data) return { erreur: "Cette demande n'existe pas ou n'est plus visible." }
  return {
    demande: { ...demande.data, nbOffres: comptes.data?.[0]?.nb_offres ?? 0 },
    offre: offre.data,
  }
}

// Crée l'offre, ou met à jour l'offre existante (modifiée ou remise après un retrait)
export async function envoyerOffre({ idDemande, idArtisan, offreExistante, prix, message }) {
  const valeurs = { price: Number(prix), message: message.trim() || null }
  const { error } = offreExistante
    ? await supabase.from('offers').update({ ...valeurs, status: 'en_attente' }).eq('id', offreExistante.id)
    : await supabase.from('offers').insert({ ...valeurs, request_id: idDemande, artisan_id: idArtisan })
  return error ? { erreur: messageErreur(error) } : {}
}

export async function retirerOffre(idOffre) {
  const { error } = await supabase.from('offers').update({ status: 'retiree' }).eq('id', idOffre)
  return error ? { erreur: messageErreur(error) } : {}
}

// « Mes offres » : les offres de l'artisan connecté, les plus récentes en premier
export async function chargerMesOffres(idArtisan) {
  const { data, error } = await supabase
    .from('offers')
    // offers et requests sont liées deux fois (request_id et accepted_offer_id) :
    // on précise la clé étrangère à suivre, sinon Supabase refuse la requête
    .select(`id, price, message, status, updated_at, demande:requests!offers_request_id_fkey(${COLONNES_DEMANDE})`)
    .eq('artisan_id', idArtisan)
    .order('updated_at', { ascending: false })
  if (error) return { erreur: 'Impossible de charger vos offres. Rechargez la page.' }
  return { offres: data }
}

// --- Crédit simulé de l'artisan (US15, RG13 : simulation, aucun argent réel) ---

export const TYPES_MOUVEMENT = {
  recharge_simulee: 'Recharge simulée',
  commission: 'Commission (14 %)',
  remboursement: 'Remboursement',
}

// Solde (profiles.credit_balance) et derniers mouvements (la RLS ne renvoie que ceux de l'artisan)
export async function chargerCredit(idArtisan) {
  const [solde, mouvements] = await Promise.all([
    supabase.from('profiles').select('credit_balance').eq('id', idArtisan).maybeSingle(),
    supabase
      .from('credit_movements')
      .select('id, amount, kind, created_at')
      .eq('artisan_id', idArtisan)
      .order('created_at', { ascending: false })
      .limit(5),
  ])
  if (solde.error || mouvements.error) return { erreur: 'Impossible de charger votre crédit. Rechargez la page.' }
  return { solde: solde.data?.credit_balance ?? 0, mouvements: mouvements.data }
}
