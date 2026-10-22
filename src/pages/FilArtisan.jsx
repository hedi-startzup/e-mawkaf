import { createElement, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { CalendarDays, ChevronRight, MessageSquareText, Search, UserRound } from 'lucide-react'
import { chargerFilArtisan } from '../lib/demandes'
import { aujourdhuiCasablanca, demainCasablanca, libelleJour } from '../lib/dates'
import { iconeMetier } from '../lib/icones'
import { Epingle, Etoile } from '../components/Marque'

// Fil de l'artisan.
// US04 : sans métier, un message l'invite à compléter son profil.
// US07 : demandes ouvertes qui le concernent. Le filtrage (métiers + « Autre », ville,
// aujourd'hui ou demain, disponibilité) est fait par la base : RLS de requests (RG05, RG12).
export default function FilArtisan({ profil, allerAuProfil }) {
  const sansMetier = profil.trades.length === 0
  // Recharger le fil quand la ville, les métiers ou la disponibilité changent
  const { city, available_today } = profil
  const metiersCle = profil.trades.join(',')
  const cle = `${city}|${metiersCle}|${available_today}`
  const [resultat, setResultat] = useState({ cle: null, demandes: [], erreur: '' })
  const [onglet, setOnglet] = useState('toutes')

  useEffect(() => {
    if (sansMetier) return
    let actif = true
    chargerFilArtisan({ city, available_today, trades: metiersCle.split(',') }).then((r) => {
      if (actif) setResultat({ cle, ...r })
    })
    return () => {
      actif = false
    }
  }, [cle, sansMetier, city, available_today, metiersCle])

  if (sansMetier) {
    return (
      <section className="flex flex-col gap-5 md:mx-auto md:w-full md:max-w-2xl">
        <h1 className="text-[28px] leading-tight">Mon fil</h1>
        <div className="flex flex-col gap-3 rounded-card border border-sand-deep bg-sand p-4">
          <p className="font-display text-xl font-bold text-brand">Complétez votre profil</p>
          <p>
            Choisissez au moins un métier pour voir les demandes des clients qui vous
            concernent.
          </p>
          <button
            type="button"
            onClick={allerAuProfil}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-lg font-bold text-white shadow-press hover:bg-brand-dark active:scale-[0.98]"
          >
            <UserRound className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
            Compléter mon profil
          </button>
        </div>
      </section>
    )
  }

  const chargement = resultat.cle !== cle
  const { erreur } = resultat
  // Onglets de la maquette : filtre d'affichage seulement, la base filtre déjà (RG05, RG12)
  const onglets = [
    ['toutes', 'Toutes', null],
    // RG12 : pas d'onglet « Aujourd'hui » pour un artisan qui n'est pas disponible aujourd'hui
    ...(profil.available_today ? [['aujourdhui', "Aujourd'hui", aujourdhuiCasablanca()]] : []),
    ['demain', 'Demain', demainCasablanca()],
  ]
  const jourFiltre = onglets.find(([id]) => id === onglet)?.[2]
  const demandes = jourFiltre
    ? resultat.demandes.filter((d) => d.service_date === jourFiltre)
    : resultat.demandes

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-[28px] leading-tight">Demandes qui vous correspondent</h1>
        <p className="mt-1 text-muted">
          {profil.available_today
            ? 'Demandes pour aujourd’hui et demain.'
            : 'Vous n’êtes pas disponible aujourd’hui : demandes pour demain seulement.'}
        </p>
      </div>

      <div role="tablist" aria-label="Jour" className="flex gap-2 overflow-x-auto">
        {onglets.map(([id, libelle]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={onglet === id}
            onClick={() => setOnglet(id)}
            className={`min-h-11 shrink-0 rounded-full px-5 font-bold ${
              onglet === id ? 'bg-brand text-white shadow-press' : 'border border-line bg-white text-muted hover:text-ink'
            }`}
          >
            {libelle}
          </button>
        ))}
      </div>

      {chargement && <p className="text-muted">Chargement des demandes…</p>}

      {!chargement && erreur && (
        <p role="alert" className="rounded-card border-2 border-danger bg-white p-4 font-bold text-danger">
          {erreur}
        </p>
      )}

      {!chargement && !erreur && demandes.length === 0 && (
        // État vide de la maquette (n°11)
        <div className="flex flex-col items-center rounded-card border border-line bg-white px-4 py-10 text-center shadow-card">
          <span className="relative mb-5 grid h-32 w-32 place-items-center">
            <Etoile className="absolute inset-0 h-32 w-32 text-sand" />
            <span className="relative grid h-16 w-16 place-items-center rounded-full bg-white text-brand shadow-card">
              <Search className="h-8 w-8" strokeWidth={2.5} aria-hidden="true" />
            </span>
          </span>
          <p className="font-display text-[22px] font-bold text-brand">Aucune demande correspondante</p>
          <p className="mt-2 max-w-sm text-muted">
            Vous n’avez pas de demande correspondant à vos métiers, votre ville ou vos disponibilités pour le moment.
          </p>
          {onglet !== 'toutes' && (
            <button
              type="button"
              onClick={() => setOnglet('toutes')}
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-6 font-bold text-white shadow-press hover:bg-brand-dark"
            >
              Voir toutes les demandes
            </button>
          )}
        </div>
      )}

      {!chargement && !erreur && demandes.length > 0 && (
        <ul className="grid gap-3 md:grid-cols-2 md:gap-4">
          {demandes.map((demande) => (
            <li key={demande.id} className="h-full">
              <Link to={`/artisan/demandes/${demande.id}`} className="group block h-full rounded-card">
                <CarteDemande demande={demande} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function CarteDemande({ demande }) {
  const lieu = [demande.neighborhood, demande.district].filter(Boolean).join(', ') || 'Casablanca'
  const n = demande.nbOffres

  return (
    <article className="flex h-full flex-col gap-3 rounded-card border border-line bg-white p-4 shadow-card transition group-hover:border-brand group-hover:shadow-press">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sand text-brand">
            {createElement(iconeMetier(demande.metier.icon), {
              className: 'h-6 w-6',
              strokeWidth: 2.5,
              'aria-hidden': true,
            })}
          </span>
          <h2 className="truncate text-lg">{demande.metier.label}</h2>
        </div>
        {demande.proposed_price ? (
          <span className="shrink-0 rounded-full bg-brand-light px-3 py-1 font-bold tabular-nums text-brand">
            {demande.proposed_price} DH
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-sand px-3 py-1 font-bold text-ink">
            Devis demandé
          </span>
        )}
      </div>

      <p className="break-words">{demande.description}</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <Epingle className="h-5 w-4" />
          <span className="truncate">{lieu}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-5 w-5 text-brand" strokeWidth={2.5} aria-hidden="true" />
          {libelleJour(demande.service_date)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MessageSquareText className="h-5 w-5 text-brand" strokeWidth={2.5} aria-hidden="true" />
          {n === 0 ? 'Aucune offre' : `${n} offre${n > 1 ? 's' : ''}`}
        </span>
        <ChevronRight className="ml-auto h-6 w-6 text-brand" strokeWidth={2.5} aria-hidden="true" />
      </div>
    </article>
  )
}
