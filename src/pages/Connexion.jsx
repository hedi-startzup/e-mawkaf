import { useState } from 'react'
import { Link } from 'react-router'
import { AtSign, LockKeyhole } from 'lucide-react'
import { Filigrane, Logo } from '../components/Marque'
import { Bouton, Champ, MessageErreur } from '../components/ui'
import { connecter } from '../lib/auth'
import { emailValide, telephoneValide } from '../lib/validation'

// Connexion par e-mail ou par téléphone (US03), avec le style de la maquette (US04).
export default function Connexion() {
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreurs, setErreurs] = useState({})
  const [erreurGenerale, setErreurGenerale] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  async function envoyer(evenement) {
    evenement.preventDefault()
    setErreurGenerale(null)
    const e = {
      identifiant: emailValide(identifiant) || telephoneValide(identifiant)
        ? null
        : 'Saisissez votre e-mail ou votre téléphone (10 chiffres, commence par 06 ou 07).',
      motDePasse: motDePasse ? null : 'Saisissez votre mot de passe.',
    }
    setErreurs(e)
    if (e.identifiant || e.motDePasse) return

    setEnvoi(true)
    const { erreur } = await connecter({ identifiant, motDePasse })
    setEnvoi(false)
    // En cas de succès, PageVisiteur envoie vers l'accueil du rôle une fois le profil chargé
    if (erreur) setErreurGenerale(erreur)
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden px-4 pb-10 md:grid md:place-items-center md:py-12">
      <Filigrane className="-left-16 -top-12 h-44 w-44" />
      <Filigrane className="-right-20 top-40 h-36 w-36 opacity-50" />

      {/* Sur ordinateur, le formulaire est présenté dans une carte centrée */}
      <div className="relative mx-auto w-full max-w-md md:rounded-card md:border md:border-line md:bg-white md:p-10 md:shadow-card">
        <div className="relative pt-10 md:pt-0">
          <Logo grand />
          <p className="mt-3 text-center text-[17px] text-muted">Artisans à la journée · Casablanca</p>
        </div>

        <form onSubmit={envoyer} noValidate className="relative mt-10 flex flex-col gap-5">
          <Champ id="identifiant" label="E-mail ou téléphone" icone={AtSign} autoComplete="username"
            placeholder="06 12 34 56 78" value={identifiant}
            onChange={(e) => { setIdentifiant(e.target.value); setErreurs((x) => ({ ...x, identifiant: null })) }}
            erreur={erreurs.identifiant} />
          <Champ id="motDePasse" label="Mot de passe" icone={LockKeyhole} type="password"
            autoComplete="current-password" value={motDePasse}
            onChange={(e) => { setMotDePasse(e.target.value); setErreurs((x) => ({ ...x, motDePasse: null })) }}
            erreur={erreurs.motDePasse} />
          <MessageErreur>{erreurGenerale}</MessageErreur>
          <Bouton type="submit" disabled={envoi} className="mt-2">{envoi ? 'Connexion…' : 'Se connecter'}</Bouton>
        </form>

        <p className="relative mt-8 text-center text-lg">
          Pas encore de compte ? <Link to="/inscription" className="font-bold text-brand underline">Créer un compte</Link>
        </p>
      </div>
    </main>
  )
}
