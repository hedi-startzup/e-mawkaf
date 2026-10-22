import { useState } from 'react'
import { HardHat, House, Smartphone, UserRound } from 'lucide-react'
import { CadreVisiteur } from '../components/Marque'
import { Bouton, Champ, Choix, MessageErreur, Titre } from '../components/ui'
import { completerProfil, deconnecter } from '../lib/auth'
import { useSession } from '../lib/session'
import { erreurNom, erreurRole, erreurTelephone } from '../lib/validation'

const ROLES = [
  { valeur: 'client', label: 'Je suis client', icone: House },
  { valeur: 'artisan', label: 'Je suis artisan', icone: HardHat },
]

// Après une première connexion Google : le compte n'a ni rôle (RG01) ni téléphone (RG02).
// On les demande ici, une seule fois, avant d'ouvrir l'espace client ou artisan.
export default function CompleterProfil() {
  const { utilisateur, mettreAJourProfil } = useSession()
  const infos = utilisateur?.user_metadata ?? {}
  const [form, setForm] = useState({ role: '', nom: infos.full_name ?? infos.name ?? '', telephone: '' })
  const [erreurs, setErreurs] = useState({})
  const [erreurGenerale, setErreurGenerale] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  function changer(champ, valeur) {
    setForm((f) => ({ ...f, [champ]: valeur }))
    setErreurs((e) => ({ ...e, [champ]: null }))
  }

  async function envoyer(evenement) {
    evenement.preventDefault()
    setErreurGenerale(null)
    const e = { role: erreurRole(form.role), nom: erreurNom(form.nom), telephone: erreurTelephone(form.telephone) }
    setErreurs(e)
    if (Object.values(e).some(Boolean)) return

    setEnvoi(true)
    const { profil, erreur } = await completerProfil(form)
    setEnvoi(false)
    if (erreur || !profil) return setErreurGenerale(erreur ?? 'Votre profil n’a pas pu être enregistré. Réessayez.')
    // La session passe au profil complet : PageACompleter envoie alors vers l'accueil du rôle
    mettreAJourProfil(profil)
  }

  return (
    <CadreVisiteur>
      <Titre sousTitre="Encore une étape avant de commencer.">Compléter mon profil</Titre>

      <form onSubmit={envoyer} noValidate className="flex flex-col gap-6">
        <Choix legende="Vous êtes…" options={ROLES} valeur={form.role}
          onChange={(v) => changer('role', v)} erreur={erreurs.role} />
        <Champ id="nom" label="Votre nom" icone={UserRound} autoComplete="name" value={form.nom}
          onChange={(e) => changer('nom', e.target.value)} erreur={erreurs.nom} />
        <Champ id="telephone" label="Téléphone (pour WhatsApp)" icone={Smartphone} type="tel" inputMode="tel"
          autoComplete="tel" placeholder="06 12 34 56 78"
          aide="Visible seulement par la personne avec qui vous travaillez."
          value={form.telephone} onChange={(e) => changer('telephone', e.target.value)} erreur={erreurs.telephone} />
        <MessageErreur>{erreurGenerale}</MessageErreur>
        <Bouton type="submit" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Continuer'}</Bouton>
      </form>

      <button type="button" onClick={deconnecter} className="min-h-12 self-center font-bold text-brand underline">
        Annuler et se déconnecter
      </button>
    </CadreVisiteur>
  )
}
