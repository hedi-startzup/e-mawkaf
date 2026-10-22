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

// Demandes du client connecté, les plus récentes en premier (la RLS ne renvoie que les siennes)
export async function chargerMesDemandes(idClient) {
  const { data, error } = await supabase
    .from('requests')
    .select('id, description, district, neighborhood, service_date, proposed_price, status, created_at, metier:trades(label, icon)')
    .eq('client_id', idClient)
    .order('created_at', { ascending: false })
  if (error) return { erreur: 'Impossible de charger vos demandes. Rechargez la page.' }
  return { demandes: data }
}
