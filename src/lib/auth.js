import { supabase } from './supabase'
import { emailValide, nettoyerTelephone, telephoneInternational } from './validation'

// À l'inscription, le nom, le rôle et le téléphone sont rangés dans le compte
// Supabase (user_metadata). Dès que l'utilisateur est connecté, obtenirProfil()
// les recopie dans les tables profiles et contacts (US02) si ce n'est pas déjà fait.

// Traduit les erreurs de Supabase : jamais de message technique brut à l'écran.
function messageErreur(error) {
  const texte = (error?.message ?? '').toLowerCase()
  if (texte.includes('already registered') || texte.includes('already exists')) {
    return 'Un compte existe déjà avec cet identifiant. Connectez-vous plutôt.'
  }
  if (texte.includes('invalid login credentials')) {
    return 'Identifiant ou mot de passe incorrect.'
  }
  if (texte.includes('rate limit') || texte.includes('too many')) {
    return 'Trop de tentatives. Attendez une minute puis réessayez.'
  }
  if (texte.includes('fetch') || texte.includes('network')) {
    return 'Pas de connexion internet. Vérifiez votre réseau puis réessayez.'
  }
  return 'Une erreur est survenue. Réessayez dans un instant.'
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

// Connexion avec Google : Supabase renvoie ensuite vers l'appli. À la première connexion,
// le compte n'a ni rôle ni téléphone : la session envoie vers « Compléter mon profil ».
// La clé Google est réglée dans le tableau de bord Supabase, jamais dans le code.
export async function connecterAvecGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) return { erreur: 'La connexion avec Google est indisponible pour le moment. Utilisez votre e-mail ou votre téléphone.' }
  return {}
}

// Après une connexion Google : enregistre le rôle (RG01), le nom et le téléphone (RG02) dans le
// compte, puis crée le profil et le contact exactement comme après une inscription (obtenirProfil).
export async function completerProfil({ role, nom, telephone }) {
  const { data, error } = await supabase.auth.updateUser({
    data: { role, full_name: nom.trim(), phone: nettoyerTelephone(telephone) },
  })
  if (error) return { erreur: messageErreur(error) }
  return obtenirProfil(data.user)
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
  if (lecture.error) return { erreur: 'Impossible de charger votre profil. Rechargez la page.' }
  if (lecture.data) return { profil: lecture.data }

  // Compte sans rôle ou sans téléphone (connexion Google) : l'utilisateur doit compléter son profil
  const infos = utilisateur.user_metadata ?? {}
  if (!infos.role || !infos.full_name || !infos.phone) return { aCompleter: true }

  // Le rôle n'est choisi qu'ici, une seule fois : la base interdit de le modifier ensuite (RG01)
  const profil = await supabase
    .from('profiles')
    .insert({ id: utilisateur.id, role: infos.role, full_name: infos.full_name })
    .select(COLONNES_PROFIL)
    .single()
  if (profil.error && profil.error.code !== DEJA_EXISTANT) {
    return { erreur: 'Impossible de créer votre profil. Rechargez la page.' }
  }

  const contact = await supabase.from('contacts').insert({ user_id: utilisateur.id, phone: infos.phone })
  if (contact.error && contact.error.code !== DEJA_EXISTANT) {
    return { erreur: "Impossible d'enregistrer votre téléphone. Rechargez la page." }
  }

  // Si une autre création a eu lieu en même temps, on relit le profil
  if (profil.error) return obtenirProfil(utilisateur)
  return { profil: profil.data }
}

// Accueil selon le rôle du profil (RG01)
export function accueilDe(profil) {
  return profil?.role === 'artisan' ? '/artisan' : '/client'
}

// --- Paramètres du compte (maquette n°9) ---

// Téléphone de l'utilisateur connecté (la RLS de contacts autorise la lecture du sien)
export async function chargerMonTelephone(idUtilisateur) {
  const { data, error } = await supabase.from('contacts').select('phone').eq('user_id', idUtilisateur).maybeSingle()
  if (error) return { erreur: 'Impossible de charger votre téléphone. Rechargez la page.' }
  return { telephone: data?.phone ?? '' }
}

// Enregistre le nom (profiles) et, si fourni, le téléphone (contacts, RG02)
export async function modifierCompte({ idUtilisateur, nom, telephone }) {
  const profil = await supabase.from('profiles').update({ full_name: nom.trim() }).eq('id', idUtilisateur)
  if (profil.error) return { erreur: "Votre nom n'a pas pu être enregistré. Réessayez dans un instant." }
  if (telephone !== undefined) {
    const contact = await supabase
      .from('contacts')
      .update({ phone: nettoyerTelephone(telephone) })
      .eq('user_id', idUtilisateur)
    if (contact.error) return { erreur: "Votre téléphone n'a pas pu être enregistré. Réessayez dans un instant." }
  }
  return {}
}

export async function changerMotDePasse(motDePasse) {
  const { error } = await supabase.auth.updateUser({ password: motDePasse })
  if (!error) return {}
  const texte = (error.message ?? '').toLowerCase()
  if (texte.includes('different from the old')) {
    return { erreur: 'Nouveau mot de passe : il doit être différent de l’ancien.' }
  }
  if (texte.includes('reauthentication') || texte.includes('recent login')) {
    return { erreur: 'Par sécurité, déconnectez-vous puis reconnectez-vous avant de changer le mot de passe.' }
  }
  return { erreur: messageErreur(error) }
}
