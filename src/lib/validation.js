// Vérifications des champs de formulaire. Chaque fonction renvoie un message
// d'erreur en français (quel champ, comment le corriger) ou null si tout va bien.

// Retire les espaces, points et tirets : « 06 12 34 56 78 » → « 0612345678 »
export function nettoyerTelephone(valeur) {
  return valeur.replace(/[\s.-]/g, '')
}

// RG02 : mobile marocain de 10 chiffres commençant par 06 ou 07
export function telephoneValide(valeur) {
  return /^0[67]\d{8}$/.test(nettoyerTelephone(valeur))
}

// Supabase attend le format international : 0612345678 → +212612345678
export function telephoneInternational(valeur) {
  return '+212' + nettoyerTelephone(valeur).slice(1)
}

export function emailValide(valeur) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valeur.trim())
}

export function erreurNom(nom) {
  if (nom.trim().length < 2) return 'Saisissez votre nom (2 lettres au moins).'
  return null
}

export function erreurEmail(email) {
  if (!email.trim()) return "Saisissez votre adresse e-mail."
  if (!emailValide(email)) return "L'adresse e-mail n'est pas valide. Exemple : yasmine@gmail.com"
  return null
}

export function erreurTelephone(telephone) {
  if (!telephone.trim()) return 'Saisissez votre numéro de téléphone.'
  if (!telephoneValide(telephone)) {
    return 'Le téléphone doit avoir 10 chiffres et commencer par 06 ou 07. Exemple : 06 12 34 56 78'
  }
  return null
}

export function erreurMotDePasse(motDePasse) {
  if (motDePasse.length < 6) return 'Le mot de passe doit avoir au moins 6 caractères.'
  return null
}

export function erreurRole(role) {
  if (role !== 'client' && role !== 'artisan') return 'Choisissez « Je suis client » ou « Je suis artisan ».'
  return null
}

// --- Demandes (US05) ---

export const DESCRIPTION_MIN = 10
export const DESCRIPTION_MAX = 300
export const QUARTIER_MAX = 60
export const PRIX_MIN = 50
export const PRIX_MAX = 5000

export function erreurMetier(metier) {
  if (!metier) return 'Métier : touchez le métier qui correspond à votre besoin (ou « Autre »).'
  return null
}

export function erreurDescription(description) {
  const longueur = description.trim().length
  if (longueur < DESCRIPTION_MIN) {
    return `Description : décrivez votre besoin en ${DESCRIPTION_MIN} caractères au moins. Exemple : « Fuite sous l'évier de la cuisine ».`
  }
  if (longueur > DESCRIPTION_MAX) return `Description : ${DESCRIPTION_MAX} caractères au maximum.`
  return null
}

export function erreurArrondissement(arrondissement) {
  if (!arrondissement) return 'Arrondissement : choisissez-en un dans la liste.'
  return null
}

export function erreurQuartier(quartier) {
  if (quartier.trim().length > QUARTIER_MAX) return `Quartier : ${QUARTIER_MAX} caractères au maximum.`
  return null
}

// RG04 : prix facultatif pour une demande, entier entre 50 et 5 000 DH
export function erreurPrixFacultatif(prix) {
  const valeur = prix.trim()
  if (!valeur) return null
  if (!/^\d+$/.test(valeur) || Number(valeur) < PRIX_MIN || Number(valeur) > PRIX_MAX) {
    return `Prix : un nombre entier entre ${PRIX_MIN} et ${PRIX_MAX} DH, sans centimes. Ou laissez vide pour demander un devis.`
  }
  return null
}
