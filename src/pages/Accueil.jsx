import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { CalendarDays, Check, ChevronRight, Inbox, Plus, X } from 'lucide-react'
import { Epingle, Etoile } from '../components/Marque'
import { libelleJour } from '../lib/dates'
import { STATUTS_DEMANDE, annulable, annulerDemande, chargerMesDemandes } from '../lib/demandes'
import { iconeMetier } from '../lib/icones'
import { useSession } from '../lib/session'

function texteOffres(nb) {
  if (nb === 0) return 'Aucune offre pour l’instant'
  return nb === 1 ? '1 offre reçue' : `${nb} offres reçues`
}

// Annulation avec confirmation dans la carte (RG09)
function Annulation({ demande, surAnnulee }) {
  const [confirmation, setConfirmation] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)

  async function annuler() {
    setEnvoi(true)
    setErreur(null)
    const { erreur: e } = await annulerDemande(demande.id)
    setEnvoi(false)
    if (e) return setErreur(e)
    surAnnulee()
  }

  if (!confirmation) {
    return (
      <button
        type="button"
        onClick={() => setConfirmation(true)}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-danger bg-white px-5 font-bold text-danger hover:bg-gray-light"
      >
        <X className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        Annuler la demande
      </button>
    )
  }

  return (
    <div role="group" aria-label="Confirmer l'annulation" className="flex flex-col gap-3 rounded-xl border-2 border-danger bg-white p-3">
      <p className="font-bold">
        Annuler cette demande ? Les artisans ne la verront plus.
        {demande.status === 'attribuee' && ' L’artisan retenu verra qu’elle est annulée.'}
      </p>
      {erreur && <p role="alert" className="font-bold text-danger">{erreur}</p>}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={envoi}
          onClick={annuler}
          className="min-h-12 rounded-full bg-danger px-4 font-bold text-white active:scale-[0.98] disabled:opacity-60"
        >
          {envoi ? 'Annulation…' : 'Oui, annuler'}
        </button>
        <button
          type="button"
          disabled={envoi}
          onClick={() => { setConfirmation(false); setErreur(null) }}
          className="min-h-12 rounded-full border-2 border-brand bg-white px-4 font-bold text-brand hover:bg-brand-light"
        >
          Non, la garder
        </button>
      </div>
    </div>
  )
}

function CarteDemande({ demande, surAnnulee }) {
  const Icone = iconeMetier(demande.metier?.icon)
  const statut = STATUTS_DEMANDE[demande.status] ?? STATUTS_DEMANDE.ouverte
  const lieu = [demande.neighborhood, demande.district].filter(Boolean).join(', ')
  return (
    <li className="flex flex-col gap-3 rounded-card border border-line bg-white p-4 shadow-card">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sand text-brand">
          <Icone className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 font-display text-lg font-bold text-brand">{demande.metier?.label}</span>
        <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${statut.classes}`}>{statut.label}</span>
      </div>
      <p className="break-words">{demande.description}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-5 w-5 text-brand" strokeWidth={2.5} aria-hidden="true" />
          {libelleJour(demande.service_date)}
        </span>
        {lieu && (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Epingle className="h-5 w-4" />
            <span className="truncate">{lieu}</span>
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-xl font-bold text-accent">
          {demande.proposed_price ? `${demande.proposed_price} DH` : 'Devis demandé'}
        </p>
        <p className="inline-flex items-center gap-1.5 font-bold text-brand">
          <Inbox className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
          {texteOffres(demande.nbOffres)}
        </p>
      </div>
      <Link
        to={`/client/demandes/${demande.id}`}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand px-5 font-bold text-white shadow-press hover:bg-brand-dark active:scale-[0.98]"
      >
        {demande.status === 'ouverte' ? `Voir les offres (${demande.nbOffres})` : 'Voir le détail'}
        <ChevronRight className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
      </Link>
      {annulable(demande) && <Annulation demande={demande} surAnnulee={surAnnulee} />}
    </li>
  )
}

// Accueil du client : « Mes demandes » (US05), avec le nombre d'offres et l'annulation (US06).
export default function Accueil() {
  const { profil } = useSession()
  const { state } = useLocation()
  const [demandes, setDemandes] = useState(null)
  const [erreur, setErreur] = useState(null)
  const prenom = (profil?.full_name ?? '').split(' ')[0]

  useEffect(() => {
    chargerMesDemandes(profil.id).then(({ demandes: liste, erreur: e }) => {
      if (e) setErreur(e)
      else setDemandes(liste)
    })
  }, [profil.id])

  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-[28px] leading-tight">Bonjour {prenom}</h1>

      {state?.demandePubliee && (
        <p role="status" className="flex items-center gap-1.5 rounded-xl bg-ok-light px-3 py-2 font-bold text-ok">
          <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
          Demande publiée. Les artisans peuvent maintenant vous faire une offre.
        </p>
      )}

      <Link
        to="/client/publier"
        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-brand px-6 text-lg font-bold text-white shadow-press hover:bg-brand-dark active:scale-[0.98] md:self-start"
      >
        <Plus className="h-6 w-6" strokeWidth={3} aria-hidden="true" />
        Publier une demande
      </Link>

      <h2 className="text-xl">Mes demandes</h2>
      {erreur && <p role="alert" className="font-bold text-danger">{erreur}</p>}
      {!demandes && !erreur && <p className="text-muted">Chargement…</p>}
      {demandes?.length === 0 && (
        <div className="flex flex-col items-center px-4 py-8 text-center">
          <Etoile className="mb-5 h-28 w-28 text-sand-deep" />
          <p className="font-display text-[22px] font-bold text-brand">Pas encore de demande</p>
          <p className="mt-2 text-muted">Publiez votre premier besoin : les artisans vous feront leurs offres.</p>
        </div>
      )}
      {demandes?.length > 0 && (
        <ul className="grid gap-3 md:grid-cols-2 md:gap-4">
          {demandes.map((demande) => (
            <CarteDemande
              key={demande.id}
              demande={demande}
              surAnnulee={() => setDemandes((liste) =>
                liste.map((d) => (d.id === demande.id ? { ...d, status: 'annulee' } : d)))}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
