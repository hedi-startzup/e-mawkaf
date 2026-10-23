import { useEffect, useState } from 'react'
import { AtSign, Check, House, LockKeyhole, Smartphone, UserRound } from 'lucide-react'
import { ChoixPhoto } from '../components/PhotoProfil'
import { Bouton, Champ, MessageErreur, Titre } from '../components/ui'
import { ADRESSE_MAX, chargerAdresseMaison, enregistrerAdresseMaison, erreurAdresse } from '../lib/adresses'
import { changerMotDePasse, chargerMonTelephone, modifierCompte } from '../lib/auth'
import { useSession } from '../lib/session'
import { erreurMotDePasse, erreurNom, erreurTelephone } from '../lib/validation'

function Confirmation({ children }) {
  if (!children) return null
  return (
    <p role="status" className="flex items-center gap-1.5 rounded-xl bg-ok-light px-3 py-2 font-bold text-ok">
      <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
      {children}
    </p>
  )
}

// Informations du compte : nom, téléphone, e-mail (lecture seule)
function InformationsCompte() {
  const { utilisateur, profil, mettreAJourProfil } = useSession()
  // Un compte créé avec le téléphone se connecte avec ce numéro : le changer dans contacts ne
  // changerait pas l'identifiant de connexion (il faudrait un code SMS, lot 2). Il reste donc en lecture seule.
  const telephoneIdentifiant = Boolean(utilisateur?.phone)
  const [form, setForm] = useState({ nom: profil.full_name, telephone: '' })
  const [erreurs, setErreurs] = useState({})
  const [erreurGenerale, setErreurGenerale] = useState(null)
  const [message, setMessage] = useState('')
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    chargerMonTelephone(profil.id).then(({ telephone, erreur }) => {
      if (erreur) setErreurGenerale(erreur)
      else setForm((f) => ({ ...f, telephone }))
    })
  }, [profil.id])

  function changer(champ, valeur) {
    setForm((f) => ({ ...f, [champ]: valeur }))
    setErreurs((e) => ({ ...e, [champ]: null }))
    setMessage('')
  }

  async function envoyer(evenement) {
    evenement.preventDefault()
    setErreurGenerale(null)
    const e = {
      nom: erreurNom(form.nom),
      telephone: telephoneIdentifiant ? null : erreurTelephone(form.telephone),
    }
    setErreurs(e)
    if (e.nom || e.telephone) return

    setEnvoi(true)
    const { erreur } = await modifierCompte({
      idUtilisateur: profil.id,
      nom: form.nom,
      telephone: telephoneIdentifiant ? undefined : form.telephone,
    })
    setEnvoi(false)
    if (erreur) return setErreurGenerale(erreur)
    mettreAJourProfil({ ...profil, full_name: form.nom.trim() })
    setMessage('Informations enregistrées.')
  }

  return (
    <form onSubmit={envoyer} noValidate className="flex flex-col gap-5 rounded-card border border-line bg-white p-5 shadow-card md:p-6">
      <h2 className="text-xl">Informations du compte</h2>
      <Champ id="nom" label="Nom complet" icone={UserRound} autoComplete="name" value={form.nom}
        onChange={(e) => changer('nom', e.target.value)} erreur={erreurs.nom} />
      {utilisateur?.email && (
        <Champ id="email" label="E-mail" icone={AtSign} value={utilisateur.email} readOnly
          className="champ bg-gray-light text-muted" aide="L’e-mail sert à vous connecter : il ne peut pas être modifié ici." />
      )}
      <Champ id="telephone" label="Téléphone" icone={Smartphone} type="tel" inputMode="tel" autoComplete="tel"
        placeholder="06 12 34 56 78" value={form.telephone} readOnly={telephoneIdentifiant}
        className={telephoneIdentifiant ? 'champ bg-gray-light text-muted' : 'champ'}
        aide={telephoneIdentifiant
          ? 'Ce numéro sert à vous connecter : il ne peut pas être modifié ici.'
          : 'Visible seulement par la personne avec qui vous travaillez.'}
        onChange={(e) => changer('telephone', e.target.value)} erreur={erreurs.telephone} />
      <MessageErreur>{erreurGenerale}</MessageErreur>
      <Confirmation>{message}</Confirmation>
      <Bouton type="submit" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</Bouton>
    </form>
  )
}

// US26 : adresse « Maison » du client, proposée à chaque demande. Lui seul peut la lire.
function AdresseMaison({ idClient }) {
  const [adresse, setAdresse] = useState('')
  const [erreur, setErreur] = useState(null)
  const [erreurGenerale, setErreurGenerale] = useState(null)
  const [message, setMessage] = useState('')
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    chargerAdresseMaison(idClient).then(({ adresse: a, erreur: e }) => {
      if (e) setErreurGenerale(e)
      else setAdresse(a)
    })
  }, [idClient])

  async function envoyer(evenement) {
    evenement.preventDefault()
    setErreurGenerale(null)
    const e = erreurAdresse(adresse)
    setErreur(e)
    if (e) return
    setEnvoi(true)
    const { erreur: echec } = await enregistrerAdresseMaison(idClient, adresse)
    setEnvoi(false)
    if (echec) return setErreurGenerale(echec)
    setMessage('Adresse enregistrée.')
  }

  return (
    <form onSubmit={envoyer} noValidate className="flex flex-col gap-5 rounded-card border border-line bg-white p-5 shadow-card md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl">Mon adresse</h2>
        <p className="text-muted">Proposée à chaque demande (« Maison »). Seul l'artisan que vous choisissez la voit.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="adresse-maison" className="flex items-end justify-between gap-3 font-bold">
          <span className="flex items-center gap-2">
            <House className="h-5 w-5 text-brand" strokeWidth={2.5} aria-hidden="true" />
            Adresse complète
          </span>
          <span className="text-sm font-normal tabular-nums text-muted">{adresse.trim().length} / {ADRESSE_MAX}</span>
        </label>
        <textarea
          id="adresse-maison"
          rows={2}
          maxLength={ADRESSE_MAX}
          placeholder="Exemple : 12 rue Ibnou Mounir, immeuble B, 3e étage, appt 7"
          value={adresse}
          aria-invalid={Boolean(erreur)}
          onChange={(e) => { setAdresse(e.target.value); setErreur(null); setMessage('') }}
          className="champ h-auto py-3"
        />
        {erreur && <p className="font-bold text-danger">{erreur}</p>}
      </div>
      <MessageErreur>{erreurGenerale}</MessageErreur>
      <Confirmation>{message}</Confirmation>
      <Bouton type="submit" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</Bouton>
    </form>
  )
}

function MotDePasse() {
  const [form, setForm] = useState({ nouveau: '', confirmation: '' })
  const [erreurs, setErreurs] = useState({})
  const [erreurGenerale, setErreurGenerale] = useState(null)
  const [message, setMessage] = useState('')
  const [envoi, setEnvoi] = useState(false)

  function changer(champ, valeur) {
    setForm((f) => ({ ...f, [champ]: valeur }))
    setErreurs((e) => ({ ...e, [champ]: null }))
    setMessage('')
  }

  async function envoyer(evenement) {
    evenement.preventDefault()
    setErreurGenerale(null)
    const e = {
      nouveau: erreurMotDePasse(form.nouveau),
      confirmation: form.confirmation === form.nouveau ? null : 'Confirmation : retapez exactement le nouveau mot de passe.',
    }
    setErreurs(e)
    if (e.nouveau || e.confirmation) return

    setEnvoi(true)
    const { erreur } = await changerMotDePasse(form.nouveau)
    setEnvoi(false)
    if (erreur) return setErreurGenerale(erreur)
    setForm({ nouveau: '', confirmation: '' })
    setMessage('Mot de passe modifié.')
  }

  return (
    <form onSubmit={envoyer} noValidate className="flex flex-col gap-5 rounded-card border border-line bg-white p-5 shadow-card md:p-6">
      <h2 className="text-xl">Changer le mot de passe</h2>
      <Champ id="nouveau" label="Nouveau mot de passe" icone={LockKeyhole} type="password" autoComplete="new-password"
        aide="6 caractères au moins." value={form.nouveau}
        onChange={(e) => changer('nouveau', e.target.value)} erreur={erreurs.nouveau} />
      <Champ id="confirmation" label="Confirmer le nouveau mot de passe" icone={LockKeyhole} type="password"
        autoComplete="new-password" value={form.confirmation}
        onChange={(e) => changer('confirmation', e.target.value)} erreur={erreurs.confirmation} />
      <MessageErreur>{erreurGenerale}</MessageErreur>
      <Confirmation>{message}</Confirmation>
      <Bouton type="submit" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Changer le mot de passe'}</Bouton>
    </form>
  )
}

// Paramètres du compte (maquette n°9), pour les clients et les artisans
export default function Parametres() {
  const { profil, mettreAJourProfil } = useSession()
  return (
    <section className="flex flex-col gap-6">
      <Titre sousTitre="Gérez les informations de votre compte.">Paramètres</Titre>
      <div className="grid items-start gap-5 md:grid-cols-2">
        {/* US23 : facultative pour le client, obligatoire pour l'artisan (aussi dans « Mon profil ») */}
        <ChoixPhoto profil={profil} surMiseAJour={mettreAJourProfil} obligatoire={profil.role === 'artisan'} />
        <InformationsCompte />
        {profil.role === 'client' && <AdresseMaison idClient={profil.id} />}
        <MotDePasse />
      </div>
    </section>
  )
}
