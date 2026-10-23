import { useState } from 'react'
import { CircleCheckBig, Send, Star } from 'lucide-react'
import { COMMENTAIRE_MAX, noterArtisan, terminerDemande } from '../lib/demandes'

const LIBELLES_NOTE = ['', 'Très mauvais', 'Mauvais', 'Correct', 'Bien', 'Excellent']

function Etoiles({ valeur, taille = 'h-6 w-6' }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${valeur} étoile${valeur > 1 ? 's' : ''} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden="true" strokeWidth={2}
          className={`${taille} ${n <= valeur ? 'fill-accent text-accent' : 'text-line'}`} />
      ))}
    </span>
  )
}

// Demande attribuée : le client confirme que l'intervention a eu lieu (RG10)
function Terminer({ demande, prenom, surTerminee }) {
  const [confirmation, setConfirmation] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)

  async function terminer() {
    setEnvoi(true)
    setErreur(null)
    const { erreur: e } = await terminerDemande(demande.id)
    setEnvoi(false)
    if (e) return setErreur(e)
    surTerminee()
  }

  if (!confirmation) {
    return (
      <button
        type="button"
        onClick={() => setConfirmation(true)}
        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-brand px-6 text-lg font-bold text-white shadow-press hover:bg-brand-dark active:scale-[0.98]"
      >
        <CircleCheckBig className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
        Intervention terminée
      </button>
    )
  }

  return (
    <div role="group" aria-label="Confirmer la fin de l'intervention" className="flex flex-col gap-3 rounded-xl border-2 border-brand bg-brand-light p-3">
      <p className="font-bold">L'intervention de {prenom} a bien eu lieu ?</p>
      {erreur && <p role="alert" className="font-bold text-danger">{erreur}</p>}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" disabled={envoi} onClick={terminer}
          className="min-h-12 rounded-full bg-brand px-4 font-bold text-white hover:bg-brand-dark active:scale-[0.98] disabled:opacity-60">
          {envoi ? 'Envoi…' : "Oui, c'est terminé"}
        </button>
        <button type="button" disabled={envoi} onClick={() => { setConfirmation(false); setErreur(null) }}
          className="min-h-12 rounded-full border-2 border-brand bg-white px-4 font-bold text-brand">
          Non
        </button>
      </div>
    </div>
  )
}

// Demande terminée et pas encore notée : note de 1 à 5 et commentaire facultatif (RG10)
function Noter({ demande, offre, idClient, prenom, surNotee }) {
  const [score, setScore] = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  async function envoyer(evenement) {
    evenement.preventDefault()
    if (!score) return setErreur('Note : touchez une étoile, de 1 (très mauvais) à 5 (excellent).')
    if (commentaire.trim().length > COMMENTAIRE_MAX) return setErreur(`Commentaire : ${COMMENTAIRE_MAX} caractères au maximum.`)
    setEnvoi(true)
    setErreur(null)
    const { erreur: e } = await noterArtisan({
      idDemande: demande.id, idArtisan: offre.artisan.id, idClient, score, commentaire,
    })
    setEnvoi(false)
    if (e) return setErreur(e)
    surNotee()
  }

  return (
    <form onSubmit={envoyer} noValidate className="flex flex-col gap-4 rounded-card border-2 border-sand-deep bg-white p-4 shadow-card">
      <h2 className="text-xl">Notez {prenom}</h2>
      <div role="radiogroup" aria-label="Note de 1 à 5" className="flex flex-col items-center gap-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={score === n}
              aria-label={`${n} étoile${n > 1 ? 's' : ''} : ${LIBELLES_NOTE[n]}`}
              onClick={() => { setScore(n); setErreur(null) }}
              className="grid h-14 w-14 place-items-center rounded-full active:scale-90">
              <Star aria-hidden="true" strokeWidth={2}
                className={`h-11 w-11 ${n <= score ? 'fill-accent text-accent' : 'text-line'}`} />
            </button>
          ))}
        </div>
        <p className="min-h-6 font-bold text-brand" aria-live="polite">{LIBELLES_NOTE[score]}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="commentaire" className="flex items-end justify-between gap-3 font-bold">
          Un commentaire ? (facultatif)
          <span className="text-sm font-normal tabular-nums text-muted">{commentaire.length} / {COMMENTAIRE_MAX}</span>
        </label>
        <textarea id="commentaire" rows={3} maxLength={COMMENTAIRE_MAX} value={commentaire}
          placeholder="Exemple : Rapide et soigneux, je recommande."
          onChange={(e) => setCommentaire(e.target.value)} className="champ h-auto py-3" />
      </div>

      {erreur && <p role="alert" className="font-bold text-danger">{erreur}</p>}

      <button type="submit" disabled={envoi}
        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-brand px-6 text-lg font-bold text-white shadow-press hover:bg-brand-dark active:scale-[0.98] disabled:opacity-60">
        <Send className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
        {envoi ? 'Envoi…' : 'Envoyer ma note'}
      </button>
    </form>
  )
}

function NoteDonnee({ note, prenom }) {
  return (
    <div className="flex flex-col gap-2 rounded-card border border-line bg-white p-4 shadow-card">
      <p className="font-bold">Votre note pour {prenom}</p>
      <Etoiles valeur={note.score} />
      {note.comment && <p className="break-words text-muted">« {note.comment} »</p>}
      <p className="text-sm text-muted">Merci ! Votre avis aide les prochains clients.</p>
    </div>
  )
}

// Fin de parcours d'une demande (US12) : terminer l'intervention, puis noter l'artisan une fois
export default function Cloture({ demande, offreChoisie, maNote, idClient, prenom, surChangement }) {
  if (!offreChoisie) return null
  if (demande.status === 'attribuee') {
    return <Terminer demande={demande} prenom={prenom} surTerminee={surChangement} />
  }
  if (demande.status !== 'terminee') return null
  if (maNote) return <NoteDonnee note={maNote} prenom={prenom} />
  return <Noter demande={demande} offre={offreChoisie} idClient={idClient} prenom={prenom} surNotee={surChangement} />
}
