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
