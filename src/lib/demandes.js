import { supabase } from './supabase'

// Métiers proposés dans une demande : les 12 métiers actifs + « Autre » (RG03)
export async function chargerMetiersDemande() {
  const { data, error } = await supabase
    .from('trades')
    .select('id, label, icon')
    .eq('is_active', true)
    .order('sort_order')
  if (error) return { erreur: 'Impossible de charger la liste des métiers. Rechargez la page.' }
  return { metiers: data }
}

// Publie une demande (US05). La base vérifie aussi les règles (RLS, dates, prix).
export async function publierDemande({ idClient, metier, description, arrondissement, quartier, jour, prix }) {
  const { error } = await supabase.from('requests').insert({
    client_id: idClient,
    trade: metier,
    description: description.trim(),
    city: 'Casablanca',
    district: arrondissement,
    neighborhood: quartier.trim() || null,
    service_date: jour,
    proposed_price: prix.trim() ? Number(prix) : null, // vide = demande de devis (RG04)
  })
  if (!error) return {}
  if (error.message?.includes("aujourd'hui ou demain")) {
    return { erreur: "Jour : la demande doit être pour aujourd'hui ou demain. Rechargez la page et réessayez." }
  }
  return { erreur: "Votre demande n'a pas pu être publiée. Vérifiez votre connexion et réessayez." }
}

export const STATUTS_DEMANDE = {
  ouverte: { label: 'Ouverte', classes: 'bg-brand-light text-brand' },
  attribuee: { label: 'Attribuée', classes: 'bg-sand text-brand-dark' },
  terminee: { label: 'Terminée', classes: 'bg-ok-light text-ok' },
  annulee: { label: 'Annulée', classes: 'bg-gray-light text-muted' },
}

const COLONNES_DEMANDE =
  'id, description, district, neighborhood, service_date, proposed_price, status, accepted_offer_id, created_at, metier:trades(label, icon)'

// Demandes du client connecté, les plus récentes en premier (la RLS ne renvoie que les siennes)
export async function chargerMesDemandes(idClient) {
  const { data, error } = await supabase
    .from('requests')
    .select(COLONNES_DEMANDE)
    .eq('client_id', idClient)
    .order('created_at', { ascending: false })
  if (error) return { erreur: 'Impossible de charger vos demandes. Rechargez la page.' }
  if (data.length === 0) return { demandes: [] }

  // Nombre d'offres reçues par demande, hors offres retirées (fonction nombre_offres, US06)
  const comptes = await supabase.rpc('nombre_offres', { p_request_ids: data.map((d) => d.id) })
  if (comptes.error) return { erreur: 'Impossible de charger vos demandes. Rechargez la page.' }
  const nbParDemande = new Map(comptes.data.map((c) => [c.request_id, c.nb_offres]))
  return { demandes: data.map((d) => ({ ...d, nbOffres: nbParDemande.get(d.id) ?? 0 })) }
}

// RG09 : une demande ouverte ou attribuée peut être annulée (la base refuse les autres cas)
export function annulable(demande) {
  return demande.status === 'ouverte' || demande.status === 'attribuee'
}

export async function annulerDemande(idDemande) {
  const { data, error } = await supabase
    .from('requests')
    .update({ status: 'annulee' })
    .eq('id', idDemande)
    .select('status')
    .maybeSingle()
  if (error || data?.status !== 'annulee') {
    return { erreur: "La demande n'a pas pu être annulée. Rechargez la page et réessayez." }
  }
  return {}
}

// --- Comparer les offres et en choisir une (US09) ---

// Une demande du client et ses offres (hors retirées), de la moins chère à la plus chère,
// avec le prénom, la disponibilité et la note de chaque artisan (RG11)
export async function chargerDetailDemande(idDemande) {
  const [demande, offres] = await Promise.all([
    supabase.from('requests').select(COLONNES_DEMANDE).eq('id', idDemande).maybeSingle(),
    supabase
      .from('offers')
      // offers est liée à profiles par artisan_id : on précise la clé étrangère à suivre
      .select('id, price, message, status, created_at, artisan:profiles!offers_artisan_id_fkey(id, full_name, available_today)')
      .eq('request_id', idDemande)
      .neq('status', 'retiree')
      .order('price', { ascending: true })
      .order('created_at', { ascending: true }),
  ])
  if (demande.error || offres.error) return { erreur: 'Impossible de charger la demande. Rechargez la page.' }
  if (!demande.data) return { erreur: "Cette demande n'existe pas ou ne vous appartient pas." }
  if (offres.data.length === 0) return { demande: demande.data, offres: [] }

  const notes = await supabase
    .from('artisan_ratings')
    .select('artisan_id, average_score, ratings_count')
    .in('artisan_id', offres.data.map((o) => o.artisan.id))
  if (notes.error) return { erreur: 'Impossible de charger les notes des artisans. Rechargez la page.' }
  const noteParArtisan = new Map(notes.data.map((n) => [n.artisan_id, n]))

  return {
    demande: demande.data,
    offres: offres.data.map((o) => ({ ...o, note: noteParArtisan.get(o.artisan.id) ?? null })),
  }
}

// RG07 : la fonction choisir_offre attribue la demande, accepte l'offre et refuse les autres
export async function choisirOffre(idOffre) {
  const { error } = await supabase.rpc('choisir_offre', { offer_id: idOffre })
  if (!error) return {}
  const texte = error.message ?? ''
  if (texte.includes("n'est plus ouverte")) return { erreur: 'Cette demande a déjà une offre choisie ou a été annulée. Rechargez la page.' }
  if (texte.includes("n'est plus disponible")) return { erreur: "L'artisan a retiré ou modifié cette offre. Rechargez la page pour voir les offres à jour." }
  return { erreur: "L'offre n'a pas pu être choisie. Vérifiez votre connexion et réessayez." }
}

// « 4,6 ★ (12 avis) » ou null si l'artisan n'a pas encore d'avis (« Nouveau »)
export function texteNote(note) {
  if (!note) return null
  const moyenne = Number(note.average_score).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return `${moyenne} ★ (${note.ratings_count} avis)`
}

// --- Fil de l'artisan (US07) ---

// Demandes ouvertes visibles par l'artisan connecté (la RLS applique RG05 et RG12),
// avec leur métier et le nombre d'offres reçues. Utilisé par le fil et le tableau de bord.
export async function chargerFilArtisan() {
  const messageErreur = 'Impossible de charger les demandes. Rechargez la page.'

  const [reponseDemandes, reponseMetiers] = await Promise.all([
    supabase
      .from('requests')
      .select('id, trade, description, district, neighborhood, service_date, proposed_price, created_at')
      .eq('status', 'ouverte')
      .order('created_at', { ascending: false }),
    supabase.from('trades').select('id, label, icon'),
  ])
  if (reponseDemandes.error || reponseMetiers.error) return { demandes: [], erreur: messageErreur }

  const demandes = reponseDemandes.data
  if (demandes.length === 0) return { demandes: [], erreur: '' }

  const { data: comptes, error } = await supabase.rpc('nombre_offres', {
    p_request_ids: demandes.map((d) => d.id),
  })
  if (error) return { demandes: [], erreur: messageErreur }

  const metiers = Object.fromEntries(reponseMetiers.data.map((m) => [m.id, m]))
  const nbOffres = Object.fromEntries(comptes.map((c) => [c.request_id, c.nb_offres]))

  return {
    demandes: demandes.map((d) => ({
      ...d,
      metier: metiers[d.trade] ?? { label: d.trade, icon: '' },
      nbOffres: nbOffres[d.id] ?? 0,
    })),
    erreur: '',
  }
}
