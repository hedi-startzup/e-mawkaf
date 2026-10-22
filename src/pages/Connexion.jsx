import { useState } from 'react'
import { Link } from 'react-router'
import { AtSign, LockKeyhole } from 'lucide-react'
import { CadreVisiteur } from '../components/Marque'
import { Bouton, BoutonGoogle, Champ, MessageErreur, Titre } from '../components/ui'
import { connecter, connecterAvecGoogle } from '../lib/auth'
import { emailValide, telephoneValide } from '../lib/validation'

// Connexion par e-mail ou par téléphone (US03), mise en page de la maquette.
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
    <CadreVisiteur>
      <Titre>Connectez-vous à votre compte</Titre>

      <form onSubmit={envoyer} noValidate className="flex flex-col gap-5">
        <Champ id="identifiant" label="E-mail ou téléphone" icone={AtSign} autoComplete="username"
          placeholder="Entrez votre e-mail ou téléphone" value={identifiant}
          onChange={(e) => { setIdentifiant(e.target.value); setErreurs((x) => ({ ...x, identifiant: null })) }}
          erreur={erreurs.identifiant} />
        <Champ id="motDePasse" label="Mot de passe" icone={LockKeyhole} type="password"
          autoComplete="current-password" placeholder="Entrez votre mot de passe" value={motDePasse}
          onChange={(e) => { setMotDePasse(e.target.value); setErreurs((x) => ({ ...x, motDePasse: null })) }}
          erreur={erreurs.motDePasse} />
        <MessageErreur>{erreurGenerale}</MessageErreur>
        <Bouton type="submit" disabled={envoi} className="mt-2">{envoi ? 'Connexion…' : 'Se connecter'}</Bouton>
        <BoutonGoogle disabled={envoi} onClick={async () => {
          setErreurGenerale(null)
          const { erreur } = await connecterAvecGoogle()
          if (erreur) setErreurGenerale(erreur)
        }} />
      </form>

      <p className="text-center text-lg">
        Pas encore de compte ? <Link to="/inscription" className="font-bold text-brand underline">S'inscrire</Link>
      </p>
    </CadreVisiteur>
  )
}
