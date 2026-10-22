import { createElement, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { CalendarDays, ChevronRight } from 'lucide-react'
import BoutonActualiser from '../components/BoutonActualiser'
import { Epingle, Etoile } from '../components/Marque'
import { MessageErreur } from '../components/ui'
import { libelleJour } from '../lib/dates'
import { iconeMetier } from '../lib/icones'
import { STATUTS_OFFRE, chargerMesOffres } from '../lib/offres'
import { useSession } from '../lib/session'
import { useTempsReel } from '../lib/tempsReel'

// « Mes offres » (US08) : toutes les offres de l'artisan, avec leur statut.
export default function MesOffres() {
  const { profil } = useSession()
  const [etat, setEtat] = useState({ charge: false, offres: [], erreur: null })
  const [version, setVersion] = useState(0) // +1 = recharger

  useEffect(() => {
    let actif = true
    chargerMesOffres(profil.id).then(({ offres, erreur }) => {
      if (actif) setEtat({ charge: true, offres: offres ?? [], erreur: erreur ?? null })
    })
    return () => {
      actif = false
    }
  }, [profil.id, version])

  // US10 : les statuts (acceptée, refusée) se mettent à jour sans recharger
  useTempsReel(`mes-offres-${profil.id}`, [{ table: 'offers', filter: `artisan_id=eq.${profil.id}` }], () =>
    setVersion((v) => v + 1),
  )

  const { charge, offres, erreur } = etat

  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-[28px] leading-tight">Mes offres</h1>
      <BoutonActualiser onClick={() => setVersion((v) => v + 1)} />

      {!charge && <p className="text-muted">Chargement…</p>}
      <MessageErreur>{erreur}</MessageErreur>

      {charge && !erreur && offres.length === 0 && (
        <div className="flex flex-col items-center px-4 py-10 text-center">
          <Etoile className="mb-5 h-32 w-32 text-sand-deep" />
          <p className="font-display text-[22px] font-bold text-brand">Pas encore d'offre</p>
          <p className="mt-2 text-muted">Ouvrez une demande dans « Mon fil » pour faire votre première offre.</p>
        </div>
      )}

      {offres.length > 0 && (
        <ul className="grid gap-3 md:grid-cols-2 md:gap-4">
          {offres.map((offre) => (
            <li key={offre.id} className="h-full">
              <CarteOffre offre={offre} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function CarteOffre({ offre }) {
  const statut = STATUTS_OFFRE[offre.status] ?? STATUTS_OFFRE.en_attente
  const demande = offre.demande
  const lieu = demande ? [demande.neighborhood, demande.district].filter(Boolean).join(', ') : ''

  const contenu = (
    <article className="flex h-full flex-col gap-3 rounded-card border border-line bg-white p-4 shadow-card transition group-hover:border-brand group-hover:shadow-press">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sand text-brand">
          {createElement(iconeMetier(demande?.metier?.icon), {
            className: 'h-6 w-6',
            strokeWidth: 2.5,
            'aria-hidden': true,
          })}
        </span>
        <h2 className="min-w-0 flex-1 truncate text-lg">{demande?.metier?.label ?? 'Demande'}</h2>
        <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${statut.classes}`}>{statut.label}</span>
      </div>
      {demande && <p className="break-words text-muted">{demande.description}</p>}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted">
        {lieu && (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Epingle className="h-5 w-4" />
            <span className="truncate">{lieu}</span>
          </span>
        )}
        {demande && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-5 w-5 text-brand" strokeWidth={2.5} aria-hidden="true" />
            {libelleJour(demande.service_date)}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-xl font-bold text-brand">Mon offre : {offre.price} DH</p>
        {demande && <ChevronRight className="h-6 w-6 shrink-0 text-brand" strokeWidth={2.5} aria-hidden="true" />}
      </div>
    </article>
  )

  return demande ? (
    <Link to={`/artisan/demandes/${demande.id}`} className="group block h-full rounded-card">
      {contenu}
    </Link>
  ) : (
    contenu
  )
}
