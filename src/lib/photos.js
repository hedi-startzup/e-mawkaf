import { supabase } from './supabase'

// Photos de profil (US23) : rangées dans l'espace Storage « avatars », privé.
// Chaque photo est dans le dossier de son propriétaire : « <id du compte>/<horodatage>.jpg ».

const ESPACE = 'avatars'
const FORMATS = ['image/jpeg', 'image/png']
const TAILLE_MAX = 5 * 1024 * 1024 // 5 Mo avant réduction
const COTE = 400 // la photo envoyée est un carré de 400 × 400 pixels
const DUREE_LIEN = 60 * 60 // les liens de lecture restent valables 1 heure

// Message clair si le fichier choisi ne convient pas, sinon null
export function erreurFichierPhoto(fichier) {
  if (!fichier) return 'Photo : choisissez une image.'
  if (!FORMATS.includes(fichier.type)) return 'Format non accepté : choisissez une photo JPEG ou PNG.'
  if (fichier.size > TAILLE_MAX) return 'Photo trop lourde : choisissez une image de 5 Mo au plus.'
  return null
}

// Recadre au centre en carré et réduit à 400 × 400, en JPEG : la photo charge vite sur téléphone
async function preparerPhoto(fichier) {
  const image = await createImageBitmap(fichier)
  const cote = Math.min(image.width, image.height)
  const toile = document.createElement('canvas')
  toile.width = COTE
  toile.height = COTE
  const contexte = toile.getContext('2d')
  contexte.fillStyle = '#ffffff' // fond blanc pour les PNG transparents
  contexte.fillRect(0, 0, COTE, COTE)
  contexte.drawImage(image, (image.width - cote) / 2, (image.height - cote) / 2, cote, cote, 0, 0, COTE, COTE)
  image.close()
  return new Promise((resoudre) => toile.toBlob(resoudre, 'image/jpeg', 0.85))
}

// Envoie la nouvelle photo, l'enregistre dans le profil, puis supprime l'ancienne.
// Renvoie { chemin } ou { erreur } (jamais de message technique brut).
export async function envoyerPhoto(idUtilisateur, fichier, ancienChemin) {
  const erreur = erreurFichierPhoto(fichier)
  if (erreur) return { erreur }

  let photo
  try {
    photo = await preparerPhoto(fichier)
  } catch {
    return { erreur: "Cette image n'a pas pu être lue. Choisissez une autre photo JPEG ou PNG." }
  }
  if (!photo) return { erreur: "Cette image n'a pas pu être lue. Choisissez une autre photo JPEG ou PNG." }

  const chemin = `${idUtilisateur}/${Date.now()}.jpg`
  const envoi = await supabase.storage.from(ESPACE).upload(chemin, photo, { contentType: 'image/jpeg' })
  if (envoi.error) return { erreur: "Votre photo n'a pas pu être envoyée. Vérifiez votre connexion et réessayez." }

  // .select() : si la base refuse sans erreur, aucune ligne ne revient et on le dit
  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_path: chemin })
    .eq('id', idUtilisateur)
    .select('id')
  if (error || !data?.length) {
    await supabase.storage.from(ESPACE).remove([chemin])
    return { erreur: "Votre photo n'a pas pu être enregistrée. Réessayez dans un instant." }
  }

  if (ancienChemin) await supabase.storage.from(ESPACE).remove([ancienChemin])
  return { chemin }
}

// Liens de lecture déjà obtenus, pour ne pas les redemander à chaque affichage
const liens = new Map()

export async function lienPhoto(chemin) {
  if (!chemin) return null
  const connu = liens.get(chemin)
  if (connu && connu.expire > Date.now()) return connu.url
  const { data, error } = await supabase.storage.from(ESPACE).createSignedUrl(chemin, DUREE_LIEN)
  if (error || !data?.signedUrl) return null
  // On le garde un peu moins longtemps que sa durée de validité
  liens.set(chemin, { url: data.signedUrl, expire: Date.now() + (DUREE_LIEN - 300) * 1000 })
  return data.signedUrl
}
