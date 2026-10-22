import { supabase } from './supabase'
import { emailValide, nettoyerTelephone, telephoneInternational } from './validation'

// En attendant les tables profiles et contacts (US02), le nom, le rôle et le
// téléphone de contact sont rangés dans le compte Supabase (user_metadata).
// Quand les tables existeront, ils y seront recopiés.

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

// Rôle de l'utilisateur connecté : 'client' ou 'artisan' (RG01)
export function roleDe(utilisateur) {
  return utilisateur?.user_metadata?.role ?? null
}

export function accueilDe(utilisateur) {
  return roleDe(utilisateur) === 'artisan' ? '/artisan' : '/client'
}
