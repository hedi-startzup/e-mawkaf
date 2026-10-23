import { useEffect, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import {
  DESCRIPTION_LITIGE_MAX, MOTIFS_LITIGE, STATUTS_LITIGE, chargerLitige, erreurDescriptionLitige, ouvrirLitige,
} from '../lib/litiges'
import { useSession } from '../lib/session'

// US25 : « Signaler un problème » sur une demande attribuée ou terminée (client ou artisan retenu).
// Un seul litige par demande ; les deux parties voient son statut, l'admin le traite.
export default function SignalerProbleme({ demande }) {
  const { profil } = useSession()
  const [etat, setEtat] = useState({ charge: false, litige: null })
  const [ouvert, setOuvert] = useState(false)
  const [motif, setMotif] = useState('')
  const [description, setDescription] = useState('')
  const [erreurs, setErreurs] = useState({})
  const [erreurGenerale, setErreurGenerale] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let actif = true
    chargerLitige(demande.id).then(({ litige }) => {
      if (actif) setEtat({ charge: true, litige: litige ?? null })
    })
    return () => {
      actif = false
    }
  }, [demande.id, version])

  async function envoyer(evenement) {
    evenement.preventDefault()
    setErreurGenerale(null)
    const e = {
      motif: motif ? null : 'Motif : choisissez le problème rencontré.',
      description: erreurDescriptionLitige(description),
    }
    setErreurs(e)
    if (e.motif || e.description) return
    setEnvoi(true)
    const { erreur } = await ouvrirLitige({ idDemande: demande.id, idUtilisateur: profil.id, motif, description })
    setEnvoi(false)
    if (erreur) return setErreurGenerale(erreur)
    setOuvert(false)
    setVersion((v) => v + 1)
  }

  if (!etat.charge) return null

  const { litige } = etat
  if (litige) {
    const statut = STATUTS_LITIGE[litige.status] ?? STATUTS_LITIGE.ouvert
    return (
      <div className="flex flex-col gap-1.5 rounded-xl bg-white p-3">
        <span className={`self-start rounded-full px-3 py-1 text-sm font-bold ${statut.classes}`}>{statut.label}</span>
        <p className="text-muted">
          {MOTIFS_LITIGE[litige.reason]} · {litige.opened_by === profil.id ? 'signalé par vous' : "signalé par l'autre partie"}
        </p>
        {litige.admin_note && <p className="break-words">Réponse de Mawkaf : « {litige.admin_note} »</p>}
      </div>
    )
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-danger bg-white px-4 font-bold text-danger hover:bg-danger/5 active:scale-[0.98]"
      >
        <TriangleAlert className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        Signaler un problème
      </button>
    )
  }

  return (
    <form onSubmit={envoyer} noValidate className="flex flex-col gap-3 rounded-xl border-2 border-danger bg-white p-3">
      <p className="font-bold">Signaler un problème à Mawkaf</p>

      <label className="flex flex-col gap-1.5">
        <span className="font-bold">Motif</span>
        <select
          value={motif}
          aria-invalid={Boolean(erreurs.motif)}
          onChange={(e) => { setMotif(e.target.value); setErreurs((x) => ({ ...x, motif: null })) }}
          className="champ"
        >
          <option value="">Choisir…</option>
          {Object.entries(MOTIFS_LITIGE).map(([cle, label]) => <option key={cle} value={cle}>{label}</option>)}
        </select>
        {erreurs.motif && <span className="font-bold text-danger">{erreurs.motif}</span>}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="flex items-end justify-between gap-3 font-bold">
          Que s'est-il passé ?
          <span className="text-sm font-normal tabular-nums text-muted">{description.trim().length} / {DESCRIPTION_LITIGE_MAX}</span>
        </span>
        <textarea
          rows={3}
          maxLength={DESCRIPTION_LITIGE_MAX}
          value={description}
          aria-invalid={Boolean(erreurs.description)}
          placeholder="Exemple : l'artisan n'est pas venu au rendez-vous de 14 h."
          onChange={(e) => { setDescription(e.target.value); setErreurs((x) => ({ ...x, description: null })) }}
          className="champ h-auto py-3"
        />
        {erreurs.description && <span className="font-bold text-danger">{erreurs.description}</span>}
      </label>

      {erreurGenerale && <p role="alert" className="font-bold text-danger">{erreurGenerale}</p>}

      <div className="grid grid-cols-2 gap-3">
        <button type="submit" disabled={envoi} className="min-h-12 rounded-xl bg-danger px-4 font-bold text-white active:scale-[0.98] disabled:opacity-60">
          {envoi ? 'Envoi…' : 'Envoyer'}
        </button>
        <button type="button" disabled={envoi} onClick={() => setOuvert(false)} className="min-h-12 rounded-xl border-2 border-line bg-white px-4 font-bold text-ink">
          Annuler
        </button>
      </div>
    </form>
  )
}
