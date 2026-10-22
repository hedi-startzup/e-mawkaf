import { useState } from 'react'
import { Info, LogOut, MessageSquareText, ShieldCheck } from 'lucide-react'
import { Filigrane } from '../components/Marque'
import { Bouton, MessageErreur, Titre } from '../components/ui'
import { CODE_SIMULE, deconnecter, validerCodeSimule } from '../lib/auth'
import { useSession } from '../lib/session'

// « 0612345678 » → « 06 12 34 56 78 »
function telephoneLisible(telephone) {
  return (telephone ?? '').replace(/(\d{2})(?=\d)/g, '$1 ')
}

// Code de vérification simulé après l'inscription par téléphone (US19).
// Exercice de formation : aucun SMS ni message WhatsApp n'est envoyé.
export default function VerificationTelephone() {
  const { utilisateur } = useSession()
  const [code, setCode] = useState('')
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  async function valider(evenement) {
    evenement.preventDefault()
    setEnvoi(true)
    setErreur(null)
    const { erreur: e } = await validerCodeSimule(code)
    setEnvoi(false)
    // En cas de succès, PageVerification envoie vers l'accueil du rôle
    if (e) setErreur(e)
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden px-4 pb-10 md:grid md:place-items-center md:py-12">
      <Filigrane className="-right-20 -top-12 h-44 w-44" />

      <div className="relative mx-auto flex w-full max-w-md flex-col gap-6 pt-10 md:rounded-card md:border md:border-line md:bg-white md:p-10 md:shadow-card">
        <p role="note" className="flex items-start gap-2 rounded-xl border-2 border-sand-deep bg-sand p-3 font-bold text-brand-dark">
          <Info className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          <span>
            Simulation : aucun SMS ni message WhatsApp n'est envoyé.
            <span className="mt-1 block font-normal">Code de démonstration : <strong className="tracking-widest">{CODE_SIMULE}</strong></span>
          </span>
        </p>

        <div className="flex flex-col items-center gap-3 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-sand text-brand">
            <MessageSquareText className="h-8 w-8" strokeWidth={2.5} aria-hidden="true" />
          </span>
          <Titre>Entrez le code reçu</Titre>
          <p className="text-lg text-muted">
            Code envoyé au <strong className="whitespace-nowrap text-ink">{telephoneLisible(utilisateur?.user_metadata?.phone)}</strong>
          </p>
        </div>

        <form onSubmit={valider} noValidate className="flex flex-col gap-5">
          <label htmlFor="code" className="sr-only">Code à 6 chiffres</label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="······"
            value={code}
            aria-invalid={Boolean(erreur)}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setErreur(null) }}
            className="champ h-16 text-center font-display text-3xl tracking-[0.5em]"
          />
          <MessageErreur>{erreur}</MessageErreur>
          <Bouton type="submit" disabled={envoi || code.length < 6} className="inline-flex items-center justify-center gap-2">
            <ShieldCheck className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
            {envoi ? 'Vérification…' : 'Valider'}
          </Bouton>
        </form>

        <button type="button" onClick={deconnecter}
          className="inline-flex min-h-12 items-center justify-center gap-2 self-center font-bold text-brand underline">
          <LogOut className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
          Se déconnecter
        </button>
      </div>
    </main>
  )
}
