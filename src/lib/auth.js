import { supabase } from './supabase'
import { emailValide, nettoyerTelephone, telephoneInternational } from './validation'

// À l'inscription, le nom, le rôle et le téléphone sont rangés dans le compte
// Supabase (user_metadata). Dès que l'utilisateur est connecté, obtenirProfil()
// les recopie dans les tables profiles et contacts (US02) si ce n'est pas déjà fait.

// Traduit les erreurs de Supabase : jamais de message technique brut à l'écran.
function messageErreur(error) {
  const texte = (error?.message ?? '').toLowerCase()
  if (texte.includes('already registered') || texte.includes('already exists')) {
    return 'Un compte existe déjà avec cet identifiant. Connecte-toi plutôt.'
  }
  if (texte.includes('invalid login credentials')) {
    return 'Identifiant ou mot de passe incorrect.'
  }
  if (texte.includes('rate limit') || texte.includes('too many')) {
    return 'Trop de tentatives. Attends une minute puis réessaie.'
  }
  if (texte.includes('fetch') || texte.includes('network')) {
    return 'Pas de connexion internet. Vérifie ton réseau puis réessaie.'
  }
  return 'Une erreur est survenue. Réessaie dans un instant.'
}

// Crée un compte. modeIdentifiant vaut 'email' ou 'telephone'.
export async function inscrire({ modeIdentifiant, email, telephone, motDePasse, nom, role }) {
  const donnees = {
    full_name: nom.trim(),
    role,
    phone: nettoyerTelephone(telephone),
  }
  const identifiant = modeIdentifiant === 'email'
    ? { email: email.trim().toLowerCase() }
    : { phone: telephoneInternational(telephone) }

  const { data, error } = await supabase.auth.signUp({
    ...identifiant,
    password: motDePasse,
    options: { data: donnees },
  })
  if (error) return { erreur: messageErreur(error) }
  // Même erreur que Supabase quand le compte existe déjà mais est masqué par sécurité
  if (data.user && data.user.identities?.length === 0) {
    return { erreur: messageErreur({ message: 'already registered' }) }
  }
  return { utilisateur: data.user }
}

// Connecte avec un e-mail ou un téléphone (détecté automatiquement).
export async function connecter({ identifiant, motDePasse }) {
  const valeur = identifiant.trim()
  const parIdentifiant = emailValide(valeur)
    ? { email: valeur.toLowerCase() }
    : { phone: telephoneInternational(valeur) }

  const { data, error } = await supabase.auth.signInWithPassword({ ...parIdentifiant, password: motDePasse })
  if (error) return { erreur: messageErreur(error) }
  return { utilisateur: data.user }
}

export async function deconnecter() {
  await supabase.auth.signOut()
}

const COLONNES_PROFIL = 'id, role, full_name, city, district, neighborhood, trades, available_today'
const DEJA_EXISTANT = '23505' // code Postgres : la ligne existe déjà

// Renvoie le profil de l'utilisateur connecté. S'il n'existe pas encore
// (juste après l'inscription, ou compte créé avant US02), il est créé, avec
// son contact, à partir des informations rangées dans le compte.
export async function obtenirProfil(utilisateur) {
  const lecture = await supabase.from('profiles').select(COLONNES_PROFIL).eq('id', utilisateur.id).maybeSingle()
  if (lecture.error) return { erreur: 'Impossible de charger ton profil. Recharge la page.' }
  if (lecture.data) return { profil: lecture.data }

  const infos = utilisateur.user_metadata ?? {}
  if (!infos.role || !infos.full_name || !infos.phone) {
    return { erreur: 'Ton compte est incomplet. Crée un nouveau compte ou contacte l\'équipe Mawkaf.' }
  }

  // Le rôle n'est choisi qu'ici, une seule fois : la base interdit de le modifier ensuite (RG01)
  const profil = await supabase
    .from('profiles')
    .insert({ id: utilisateur.id, role: infos.role, full_name: infos.full_name })
    .select(COLONNES_PROFIL)
    .single()
  if (profil.error && profil.error.code !== DEJA_EXISTANT) {
    return { erreur: 'Impossible de créer ton profil. Recharge la page.' }
  }

  const contact = await supabase.from('contacts').insert({ user_id: utilisateur.id, phone: infos.phone })
  if (contact.error && contact.error.code !== DEJA_EXISTANT) {
    return { erreur: "Impossible d'enregistrer ton téléphone. Recharge la page." }
  }

  // Si une autre création a eu lieu en même temps, on relit le profil
  if (profil.error) return obtenirProfil(utilisateur)
  return { profil: profil.data }
}

// Accueil selon le rôle du profil (RG01)
export function accueilDe(profil) {
  return profil?.role === 'artisan' ? '/artisan' : '/client'
}
