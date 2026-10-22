import { useState } from 'react'
import { Link } from 'react-router'
import { AtSign, HardHat, House, LockKeyhole, Mail, Smartphone, UserRound } from 'lucide-react'
import { Filigrane } from '../components/Marque'
import { Bouton, Champ, Choix, MessageErreur, Titre } from '../components/ui'
import { inscrire } from '../lib/auth'
import { erreurEmail, erreurMotDePasse, erreurNom, erreurRole, erreurTelephone } from '../lib/validation'

const ROLES = [
  { valeur: 'client', label: 'Je suis client', icone: House },
  { valeur: 'artisan', label: 'Je suis artisan', icone: HardHat },
]

const MODES = [
  { valeur: 'telephone', label: 'Téléphone', icone: Smartphone },
  { valeur: 'email', label: 'E-mail', icone: Mail },
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
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 overflow-hidden px-4 pt-10 pb-10">
      <Filigrane className="-right-20 -top-12 h-44 w-44" />
      <div className="relative"><Titre>Créer un compte</Titre></div>

      <form onSubmit={envoyer} noValidate className="relative flex flex-col gap-6">
        <Choix legende="Vous êtes…" options={ROLES} valeur={form.role}
          onChange={(v) => changer('role', v)} erreur={erreurs.role} />

        <Champ id="nom" label="Votre nom" icone={UserRound} autoComplete="name" value={form.nom}
          onChange={(e) => changer('nom', e.target.value)} erreur={erreurs.nom} />

        <Choix legende="Je m'inscris avec" options={MODES} valeur={form.modeIdentifiant}
          onChange={(v) => changer('modeIdentifiant', v)} />

        {parEmail && (
          <Champ id="email" label="E-mail" icone={AtSign} type="email" inputMode="email" autoComplete="email"
            placeholder="nom@exemple.ma" value={form.email}
            onChange={(e) => changer('email', e.target.value)} erreur={erreurs.email} />
        )}

        <Champ id="telephone" label={parEmail ? 'Téléphone (pour WhatsApp)' : 'Téléphone'} icone={Smartphone}
          type="tel" inputMode="tel" autoComplete="tel" placeholder="06 12 34 56 78"
          aide={parEmail
            ? 'Visible seulement par la personne avec qui vous travaillez.'
            : 'Il sert aussi à vous connecter.'}
          value={form.telephone} onChange={(e) => changer('telephone', e.target.value)} erreur={erreurs.telephone} />

        <Champ id="motDePasse" label="Mot de passe" icone={LockKeyhole} type="password" autoComplete="new-password"
          aide="6 caractères au moins." value={form.motDePasse}
          onChange={(e) => changer('motDePasse', e.target.value)} erreur={erreurs.motDePasse} />

        <MessageErreur>{erreurGenerale}</MessageErreur>

        <Bouton type="submit" disabled={envoi}>{envoi ? 'Création…' : 'Créer mon compte'}</Bouton>
      </form>

      <p className="relative text-center text-lg">
        Déjà un compte ? <Link to="/connexion" className="font-bold text-brand underline">Se connecter</Link>
      </p>
    </main>
  )
}
