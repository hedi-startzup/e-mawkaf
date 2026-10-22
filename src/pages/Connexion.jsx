import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Bouton, Champ, MessageErreur, PageMobile, Titre } from '../components/ui'
import { accueilDe, connecter } from '../lib/auth'
import { emailValide, telephoneValide } from '../lib/validation'

export default function Connexion() {
  const navigate = useNavigate()
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
        : 'Indique ton e-mail ou ton téléphone (10 chiffres, commence par 06 ou 07).',
      motDePasse: motDePasse ? null : 'Indique ton mot de passe.',
    }
    setErreurs(e)
    if (e.identifiant || e.motDePasse) return

    setEnvoi(true)
    const { utilisateur, erreur } = await connecter({ identifiant, motDePasse })
    setEnvoi(false)
    if (erreur) return setErreurGenerale(erreur)
    navigate(accueilDe(utilisateur), { replace: true })
  }

  return (
    <PageMobile>
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <p className="text-4xl font-bold text-brand">Mawkaf</p>
        <p className="text-lg text-muted">L'artisan qu'il vous faut, au prix que vous proposez.</p>
      </div>
      <Titre>Se connecter</Titre>
      <form onSubmit={envoyer} noValidate className="flex flex-col gap-6">
        <Champ id="identifiant" label="E-mail ou téléphone" autoComplete="username"
          placeholder="06 12 34 56 78" value={identifiant}
          onChange={(e) => { setIdentifiant(e.target.value); setErreurs((x) => ({ ...x, identifiant: null })) }}
          erreur={erreurs.identifiant} />
        <Champ id="motDePasse" label="Mot de passe" type="password" autoComplete="current-password"
          value={motDePasse}
          onChange={(e) => { setMotDePasse(e.target.value); setErreurs((x) => ({ ...x, motDePasse: null })) }}
          erreur={erreurs.motDePasse} />
        <MessageErreur>{erreurGenerale}</MessageErreur>
        <Bouton type="submit" disabled={envoi}>{envoi ? 'Connexion…' : 'Se connecter'}</Bouton>
      </form>
      <p className="text-center text-lg">
        Pas encore de compte ? <Link to="/inscription" className="font-semibold text-brand underline">Créer un compte</Link>
      </p>
    </PageMobile>
  )
}
