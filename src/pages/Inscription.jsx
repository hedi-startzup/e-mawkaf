import { useState } from 'react'
import { Link } from 'react-router'
import { Bouton, Champ, Choix, MessageErreur, PageMobile, Titre } from '../components/ui'
import { inscrire } from '../lib/auth'
import { erreurEmail, erreurMotDePasse, erreurNom, erreurRole, erreurTelephone } from '../lib/validation'

const ROLES = [
  { valeur: 'client', label: 'Je suis client', icone: '🏠' },
  { valeur: 'artisan', label: 'Je suis artisan', icone: '🧰' },
]

const MODES = [
  { valeur: 'telephone', label: 'Téléphone' },
  { valeur: 'email', label: 'E-mail' },
]

export default function Inscription() {
  const [form, setForm] = useState({
    role: '', modeIdentifiant: 'telephone', nom: '', email: '', telephone: '', motDePasse: '',
  })
  const [erreurs, setErreurs] = useState({})
  const [erreurGenerale, setErreurGenerale] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  function changer(champ, valeur) {
    setForm((f) => ({ ...f, [champ]: valeur }))
    setErreurs((e) => ({ ...e, [champ]: null }))
  }

  function verifier() {
    const e = {
      role: erreurRole(form.role),
      nom: erreurNom(form.nom),
      email: form.modeIdentifiant === 'email' ? erreurEmail(form.email) : null,
      telephone: erreurTelephone(form.telephone),
      motDePasse: erreurMotDePasse(form.motDePasse),
    }
    setErreurs(e)
    return Object.values(e).every((m) => !m)
  }

  async function envoyer(evenement) {
    evenement.preventDefault()
    setErreurGenerale(null)
    if (!verifier()) return
    setEnvoi(true)
    const { erreur } = await inscrire(form)
    setEnvoi(false)
    // En cas de succès, la session crée le profil puis PageVisiteur envoie vers l'accueil du rôle
    if (erreur) setErreurGenerale(erreur)
  }

  const parEmail = form.modeIdentifiant === 'email'

  return (
    <PageMobile>
      <Titre>Créer un compte</Titre>
      <form onSubmit={envoyer} noValidate className="flex flex-col gap-6">
        <Choix legende="Qui es-tu ?" options={ROLES} valeur={form.role}
          onChange={(v) => changer('role', v)} erreur={erreurs.role} />

        <Champ id="nom" label="Ton nom" autoComplete="name" value={form.nom}
          onChange={(e) => changer('nom', e.target.value)} erreur={erreurs.nom} />

        <Choix legende="Je m'inscris avec" options={MODES} valeur={form.modeIdentifiant}
          onChange={(v) => changer('modeIdentifiant', v)} />

        {parEmail && (
          <Champ id="email" label="E-mail" type="email" inputMode="email" autoComplete="email"
            value={form.email} onChange={(e) => changer('email', e.target.value)} erreur={erreurs.email} />
        )}

        <Champ id="telephone" label={parEmail ? 'Téléphone (pour WhatsApp)' : 'Téléphone'}
          type="tel" inputMode="tel" autoComplete="tel" placeholder="06 12 34 56 78"
          aide={parEmail ? 'Visible seulement par la personne avec qui tu travailles.' : 'Il sert aussi à te connecter.'}
          value={form.telephone} onChange={(e) => changer('telephone', e.target.value)} erreur={erreurs.telephone} />

        <Champ id="motDePasse" label="Mot de passe" type="password" autoComplete="new-password"
          aide="6 caractères au moins." value={form.motDePasse}
          onChange={(e) => changer('motDePasse', e.target.value)} erreur={erreurs.motDePasse} />

        <MessageErreur>{erreurGenerale}</MessageErreur>

        <Bouton type="submit" disabled={envoi}>{envoi ? 'Création…' : 'Créer mon compte'}</Bouton>
      </form>
      <p className="text-center text-lg">
        Déjà un compte ? <Link to="/connexion" className="font-semibold text-brand underline">Se connecter</Link>
      </p>
    </PageMobile>
  )
}
