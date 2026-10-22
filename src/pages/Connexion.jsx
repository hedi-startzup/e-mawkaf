import { useState } from 'react'
import { AtSign, LockKeyhole } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Filigrane, Logo } from '../components/Marque'

// Connexion par e-mail et mot de passe.
// Page minimale pour tester l'US04 avec un compte de test ; l'inscription relève de l'US03.
export default function Connexion() {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  async function seConnecter(e) {
    e.preventDefault()
    setErreur('')
    if (!email.trim() || !motDePasse) {
      setErreur('Saisissez votre e-mail et votre mot de passe.')
      return
    }
    setEnvoi(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: motDePasse,
    })
    setEnvoi(false)
    if (error) {
      setErreur('E-mail ou mot de passe incorrect. Vérifiez-les et réessayez.')
    }
  }

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-md overflow-hidden px-4 pb-10">
      <Filigrane className="-left-16 -top-12 h-44 w-44" />
      <Filigrane className="-right-20 top-40 h-36 w-36 opacity-50" />

      <div className="relative pt-10">
        <Logo grand />
        <p className="mt-3 text-center text-[17px] text-muted">Artisans à la journée · Casablanca</p>
      </div>

      <form onSubmit={seConnecter} className="relative mt-10 flex flex-col gap-5" noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 font-bold">
            <AtSign className="h-5 w-5 text-brand" strokeWidth={2.5} aria-hidden="true" />
            E-mail
          </span>
          <input
            type="email"
            autoComplete="email"
            placeholder="nom@exemple.ma"
            value={email}
            aria-invalid={Boolean(erreur)}
            onChange={(e) => setEmail(e.target.value)}
            className="champ"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 font-bold">
            <LockKeyhole className="h-5 w-5 text-brand" strokeWidth={2.5} aria-hidden="true" />
            Mot de passe
          </span>
          <input
            type="password"
            autoComplete="current-password"
            value={motDePasse}
            aria-invalid={Boolean(erreur)}
            onChange={(e) => setMotDePasse(e.target.value)}
            className="champ"
          />
        </label>

        {erreur && (
          <p role="alert" className="font-bold text-danger">
            {erreur}
          </p>
        )}

        <button
          type="submit"
          disabled={envoi}
          className="mt-2 min-h-14 rounded-full bg-brand px-6 text-lg font-bold text-white shadow-press hover:bg-brand-dark active:scale-[0.98] disabled:opacity-60"
        >
          {envoi ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </main>
  )
}
