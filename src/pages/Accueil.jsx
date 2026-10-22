import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { CalendarDays, Check, Plus } from 'lucide-react'
import { Epingle, Etoile } from '../components/Marque'
import { libelleJour } from '../lib/dates'
import { chargerMesDemandes } from '../lib/demandes'
import { iconeMetier } from '../lib/icones'
import { useSession } from '../lib/session'

const STATUTS = {
  ouverte: { label: 'Ouverte', classes: 'bg-brand-light text-brand' },
  attribuee: { label: 'Attribuée', classes: 'bg-sand text-brand-dark' },
  terminee: { label: 'Terminée', classes: 'bg-ok-light text-ok' },
  annulee: { label: 'Annulée', classes: 'bg-gray-light text-muted' },
}

function CarteDemande({ demande }) {
  const Icone = iconeMetier(demande.metier?.icon)
  const statut = STATUTS[demande.status] ?? STATUTS.ouverte
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
      <p className="font-display text-xl font-bold text-accent">
        {demande.proposed_price ? `${demande.proposed_price} DH` : 'Devis demandé'}
      </p>
    </li>
  )
}

// Accueil du client : « Mes demandes » (US05). US06 y ajoutera le nombre d'offres et l'annulation.
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
        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-brand px-6 text-lg font-bold text-white shadow-press hover:bg-brand-dark active:scale-[0.98]"
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
        <ul className="flex flex-col gap-3">
          {demandes.map((demande) => <CarteDemande key={demande.id} demande={demande} />)}
        </ul>
      )}
    </section>
  )
}
