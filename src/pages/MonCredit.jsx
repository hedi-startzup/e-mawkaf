import { useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Store, Wallet, X } from 'lucide-react'
import { Etoile } from '../components/Marque'
import { MessageErreur } from '../components/ui'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/session'

const MONTANTS = [100, 200, 500]

const LIBELLES = {
  recharge_simulee: 'Recharge simulée',
  commission: 'Commission Mawkaf (14 %)',
  remboursement: 'Commission rendue (demande annulée)',
}

// Référence de paiement fictive, à « présenter en agence » (simulation, US15)
function referenceFictive() {
  return `MWK-${Math.floor(100000 + Math.random() * 900000)}`
}

function dateLisible(iso) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Casablanca',
  }).format(new Date(iso))
}

// « Mon crédit » (US15) : solde, historique et recharge simulée. Aucun argent réel (RG13).
// Le crédit n'est jamais écrit par l'appli : la base le calcule (recharger_credit,
// commission et remboursement automatiques, migration 008).
export default function MonCredit() {
  const { profil } = useSession()
  const [etat, setEtat] = useState({ charge: false, solde: 0, mouvements: [], erreur: null })
  const [version, setVersion] = useState(0)
  const [recharge, setRecharge] = useState(null) // { montant, reference } pendant la confirmation
  const [envoi, setEnvoi] = useState(false)
  const [erreurRecharge, setErreurRecharge] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let actif = true
    Promise.all([
      supabase.from('profiles').select('credit_balance').eq('id', profil.id).single(),
      supabase
        .from('credit_movements')
        .select('id, amount, kind, created_at')
        .eq('artisan_id', profil.id)
        .order('created_at', { ascending: false }),
    ]).then(([solde, mouvements]) => {
      if (!actif) return
      if (solde.error || mouvements.error) {
        setEtat({ charge: true, solde: 0, mouvements: [], erreur: 'Impossible de charger votre crédit. Rechargez la page.' })
      } else {
        setEtat({ charge: true, solde: solde.data.credit_balance, mouvements: mouvements.data, erreur: null })
      }
    })
    return () => {
      actif = false
    }
  }, [profil.id, version])

  async function confirmerRecharge() {
    setEnvoi(true)
    setErreurRecharge(null)
    const { error } = await supabase.rpc('recharger_credit', { montant: recharge.montant })
    setEnvoi(false)
    if (error) {
      setErreurRecharge("La recharge n'a pas pu être enregistrée. Réessayez dans un instant.")
      return
    }
    setMessage(`Recharge simulée de ${recharge.montant} DH ajoutée à votre crédit.`)
    setRecharge(null)
    setVersion((v) => v + 1)
  }

  const { charge, solde, mouvements, erreur } = etat

  return (
    <section className="flex flex-col gap-6 md:mx-auto md:w-full md:max-w-2xl">
      <div>
        <h1 className="text-[28px] leading-tight">Mon crédit</h1>
        <p className="mt-1 text-sm text-muted">Démo : recharges et commissions simulées.</p>
      </div>


      <MessageErreur>{erreur}</MessageErreur>

      <div className="flex items-center gap-4 rounded-card border border-line bg-white p-4 shadow-card">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-sand text-brand">
          <Wallet className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
        </span>
        <div>
          <p className="text-muted">Solde</p>
          <p className={`font-display text-3xl font-bold ${solde < 0 ? 'text-danger' : 'text-brand'}`}>
            {charge ? `${solde} DH` : '…'}
          </p>
          {solde < 0 && <p className="text-sm text-danger">Solde négatif : rechargez votre crédit.</p>}
        </div>
      </div>

      {message && (
        <p role="status" className="rounded-xl bg-ok-light px-3 py-2 font-bold text-ok">
          {message}
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-card border-2 border-partenaire bg-partenaire-light p-4">
        <h2 className="text-xl text-partenaire-ink">Recharger (simulation)</h2>
        <p className="flex items-center gap-3 font-bold text-partenaire-ink">
          <img src="/partenaire-wafacash.png" alt="Wafacash" width={56} height={56} className="h-14 w-14 rounded-xl shadow-card" />
          Recharge en espèces dans une agence Wafacash.
        </p>

        {!recharge && (
          <div className="grid grid-cols-3 gap-3">
            {MONTANTS.map((montant) => (
              <button
                key={montant}
                type="button"
                onClick={() => {
                  setMessage('')
                  setErreurRecharge(null)
                  setRecharge({ montant, reference: referenceFictive() })
                }}
                className="min-h-14 rounded-2xl border-2 border-partenaire bg-white text-lg font-bold text-partenaire-ink hover:bg-partenaire active:scale-[0.97]"
              >
                {montant} DH
              </button>
            ))}
          </div>
        )}

        {recharge && (
          <div className="flex flex-col gap-3 rounded-card border-2 border-partenaire bg-white p-4">
            <div className="flex items-start gap-3">
              <Store className="mt-1 h-6 w-6 shrink-0 text-partenaire-ink" strokeWidth={2.5} aria-hidden="true" />
              <div>
                <p className="font-bold">Recharge de {recharge.montant} DH</p>
                <p>
                  Présentez cette référence en agence avec {recharge.montant} DH en espèces (simulation) :
                </p>
                <p className="mt-1 font-display text-2xl font-bold tracking-wider text-partenaire-ink">{recharge.reference}</p>
              </div>
            </div>
            <MessageErreur>{erreurRecharge}</MessageErreur>
            <button
              type="button"
              disabled={envoi}
              onClick={confirmerRecharge}
              className="min-h-14 rounded-full bg-partenaire px-6 text-lg font-bold text-partenaire-ink shadow-card hover:brightness-95 disabled:opacity-60"
            >
              {envoi ? 'Confirmation…' : 'Confirmer la recharge (simulation)'}
            </button>
            <button
              type="button"
              onClick={() => setRecharge(null)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-partenaire-ink bg-white font-bold text-partenaire-ink"
            >
              <X className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
              Annuler
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl">Historique</h2>
        {charge && mouvements.length === 0 && (
          <div className="flex flex-col items-center px-4 py-6 text-center">
            <Etoile className="mb-4 h-20 w-20 text-sand-deep" />
            <p className="text-muted">Aucun mouvement pour le moment.</p>
          </div>
        )}
        {mouvements.length > 0 && (
          <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-white">
            {mouvements.map((m) => {
              const positif = m.amount > 0
              const Icone = positif ? ArrowDownLeft : ArrowUpRight
              return (
                <li key={m.id} className="flex items-center gap-3 p-3">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                      positif ? 'bg-ok-light text-ok' : 'bg-sand text-accent'
                    }`}
                  >
                    <Icone className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{LIBELLES[m.kind] ?? m.kind}</p>
                    <p className="text-sm text-muted">{dateLisible(m.created_at)}</p>
                  </div>
                  <p className={`shrink-0 font-bold tabular-nums ${positif ? 'text-ok' : 'text-ink'}`}>
                    {positif ? '+' : ''}
                    {m.amount} DH
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
