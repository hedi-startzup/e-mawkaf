import { createElement, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { CalendarDays, ChevronRight, MessageSquareText, UserRound } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { libelleJour } from '../lib/dates'
import { iconeMetier } from '../lib/icones'
import { Epingle, Etoile } from '../components/Marque'

// Fil de l'artisan.
// US04 : sans métier, un message l'invite à compléter son profil.
// US07 : demandes ouvertes qui le concernent. Le filtrage (métiers + « Autre », ville,
// aujourd'hui ou demain, disponibilité) est fait par la base : RLS de requests (RG05, RG12).
export default function FilArtisan({ profil, allerAuProfil }) {
  const sansMetier = profil.trades.length === 0
  // Recharger le fil quand les métiers ou la disponibilité changent
  const cle = `${profil.trades.join(',')}|${profil.available_today}`
  const [resultat, setResultat] = useState({ cle: null, demandes: [], erreur: '' })

  useEffect(() => {
    if (sansMetier) return
    let actif = true
    chargerDemandes().then((r) => {
      if (actif) setResultat({ cle, ...r })
    })
    return () => {
      actif = false
    }
  }, [cle, sansMetier])

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
  const { demandes, erreur } = resultat

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-[28px] leading-tight">Mon fil</h1>
        <p className="mt-1 text-muted">
          {profil.available_today
            ? 'Demandes pour aujourd’hui et demain.'
            : 'Vous n’êtes pas disponible aujourd’hui : demandes pour demain seulement.'}
        </p>
      </div>

      {chargement && <p className="text-muted">Chargement des demandes…</p>}

      {!chargement && erreur && (
        <p role="alert" className="rounded-card border-2 border-danger bg-white p-4 font-bold text-danger">
          {erreur}
        </p>
      )}

      {!chargement && !erreur && demandes.length === 0 && (
        <div className="flex flex-col items-center px-4 py-10 text-center">
          <Etoile className="mb-5 h-32 w-32 text-sand-deep" />
          <p className="font-display text-[22px] font-bold text-brand">Aucune demande pour vous</p>
          <p className="mt-2 text-muted">
            Aucune demande ouverte ne correspond à vos métiers dans votre ville pour le moment.
            Revenez un peu plus tard.
          </p>
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

// Lit les demandes visibles, leurs métiers et le nombre d'offres reçues.
async function chargerDemandes() {
  const messageErreur = 'Impossible de charger les demandes. Rechargez la page.'

  const [reponseDemandes, reponseMetiers] = await Promise.all([
    supabase
      .from('requests')
      .select('id, trade, description, district, neighborhood, service_date, proposed_price, created_at')
      .eq('status', 'ouverte')
      .order('created_at', { ascending: false }),
    supabase.from('trades').select('id, label, icon'),
  ])
  if (reponseDemandes.error || reponseMetiers.error) return { demandes: [], erreur: messageErreur }

  const demandes = reponseDemandes.data
  if (demandes.length === 0) return { demandes: [], erreur: '' }

  const { data: comptes, error } = await supabase.rpc('nombre_offres', {
    p_request_ids: demandes.map((d) => d.id),
  })
  if (error) return { demandes: [], erreur: messageErreur }

  const metiers = Object.fromEntries(reponseMetiers.data.map((m) => [m.id, m]))
  const nbOffres = Object.fromEntries(comptes.map((c) => [c.request_id, c.nb_offres]))

  return {
    demandes: demandes.map((d) => ({
      ...d,
      metier: metiers[d.trade] ?? { label: d.trade, icon: '' },
      nbOffres: nbOffres[d.id] ?? 0,
    })),
    erreur: '',
  }
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
