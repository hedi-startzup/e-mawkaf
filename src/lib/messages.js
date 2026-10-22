import { supabase } from './supabase'

// Messagerie entre le client et l'artisan retenu (maquette n°8, migration 009).
// La base garantit qui peut lire et écrire (RLS de messages) : l'interface ne fait que suivre.

export const MESSAGE_MAX = 500

export function erreurMessage(texte) {
  const longueur = texte.trim().length
  if (longueur === 0) return 'Message : écrivez quelque chose avant d’envoyer.'
  if (longueur > MESSAGE_MAX) return `Message : ${MESSAGE_MAX} caractères au maximum.`
  return null
}

// Conversations de l'utilisateur : une par demande attribuée ou terminée où il est client
// ou artisan retenu, avec le nom de l'autre personne et le dernier message.
// On part des offres acceptées : la RLS d'offers ne renvoie que celles de l'artisan
// ou celles des demandes du client.
export async function chargerConversations(profil) {
  const messageErreur = 'Impossible de charger vos conversations. Rechargez la page.'
  const { data, error } = await supabase
    .from('offers')
    .select(
      'artisan_id, artisan:profiles!offers_artisan_id_fkey(full_name), ' +
        'demande:requests!offers_request_id_fkey(id, description, status, service_date, client_id, ' +
        'metier:trades(label, icon), client:profiles!requests_client_id_fkey(full_name))',
    )
    .eq('status', 'acceptee')
  if (error) return { erreur: messageErreur }

  const conversations = data
    .filter((o) => o.demande && ['attribuee', 'terminee'].includes(o.demande.status))
    .filter((o) => (profil.role === 'artisan' ? o.artisan_id === profil.id : o.demande.client_id === profil.id))
    .map((o) => ({
      idDemande: o.demande.id,
      statut: o.demande.status,
      description: o.demande.description,
      metier: o.demande.metier,
      jour: o.demande.service_date,
      nomAutre: (profil.role === 'artisan' ? o.demande.client?.full_name : o.artisan?.full_name) ?? '',
      dernier: null,
    }))
  if (conversations.length === 0) return { conversations: [] }

  // Dernier message de chaque conversation (volumes de la démo : une seule requête suffit)
  const derniers = await supabase
    .from('messages')
    .select('request_id, body, created_at, sender_id')
    .in('request_id', conversations.map((c) => c.idDemande))
    .order('created_at', { ascending: false })
    .limit(500)
  if (derniers.error) return { erreur: messageErreur }
  const parDemande = new Map()
  for (const m of derniers.data) if (!parDemande.has(m.request_id)) parDemande.set(m.request_id, m)

  return {
    conversations: conversations
      .map((c) => ({ ...c, dernier: parDemande.get(c.idDemande) ?? null }))
      // Les conversations actives d'abord, puis la plus récente
      .sort((a, b) =>
        (a.statut === 'attribuee' ? 0 : 1) - (b.statut === 'attribuee' ? 0 : 1)
        || (b.dernier?.created_at ?? '').localeCompare(a.dernier?.created_at ?? '')),
  }
}

export async function chargerMessages(idDemande) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, body, created_at')
    .eq('request_id', idDemande)
    .order('created_at', { ascending: true })
  if (error) return { erreur: 'Impossible de charger les messages. Rechargez la page.' }
  return { messages: data }
}

export async function envoyerMessage({ idDemande, idExpediteur, texte }) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ request_id: idDemande, sender_id: idExpediteur, body: texte.trim() })
    .select('id, sender_id, body, created_at')
    .single()
  if (!error) return { message: data }
  if (error.code === '42501') {
    return { erreur: 'Cette conversation est fermée : la demande est terminée ou annulée.' }
  }
  return { erreur: "Votre message n'a pas pu être envoyé. Vérifiez votre connexion et réessayez." }
}

// Nouveaux messages en direct (Realtime). surEtat reçoit faux si l'écoute échoue :
// l'écran affiche alors le bouton « Actualiser » comme solution de repli.
export function ecouterMessages(idDemande, surNouveau, surEtat) {
  const canal = supabase
    .channel(`messages-${idDemande}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `request_id=eq.${idDemande}` },
      (changement) => surNouveau(changement.new),
    )
    .subscribe((statut) => surEtat(statut === 'SUBSCRIBED'))
  return () => {
    supabase.removeChannel(canal)
  }
}
