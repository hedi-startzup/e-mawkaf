import { createElement, useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  CalendarDays, ChevronRight, Clock, Handshake, Inbox, MessagesSquare, Settings, Star, UserRound, Wallet,
} from 'lucide-react'
import Disponibilite from '../components/Disponibilite'
import { Epingle } from '../components/Marque'
import { MessageErreur, Tuile } from '../components/ui'
import { libelleJour } from '../lib/dates'
import { chargerFilArtisan, texteNote } from '../lib/demandes'
import { iconeMetier } from '../lib/icones'
import { chargerConversations } from '../lib/messages'
import { TYPES_MOUVEMENT, chargerCredit, chargerMesOffres } from '../lib/offres'
import { supabase } from '../lib/supabase'

const dateCourte = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Africa/Casablanca' })

function IconeMetier({ icone, petit = false }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-sand text-brand ${petit ? 'h-9 w-9' : 'h-11 w-11'}`}>
      {createElement(iconeMetier(icone), { className: petit ? 'h-4 w-4' : 'h-5 w-5', strokeWidth: 2.5, 'aria-hidden': true })}
    </span>
  )
}

function Carte({ titre, lien, children }) {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-white p-4 shadow-card md:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg">{titre}</h2>
        {lien}
      </div>
      {children}
    </section>
  )
}

function LienVoirTout({ to, children }) {
  return (
    <Link to={to} className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-2 text-sm font-bold text-brand hover:bg-brand-light">
      {children}
      <ChevronRight className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
    </Link>
  )
}

// Missions en cours : demandes attribuées à l'artisan (offre acceptée)
function Missions({ missions, noms }) {
  if (missions.length === 0) {
    return <p className="text-muted">Aucune mission en cours. Quand un client choisit votre offre, elle apparaît ici.</p>
  }
  return (
    <ul className="flex flex-col gap-2">
      {missions.map(({ id, price, demande }) => (
        <li key={id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
          <IconeMetier icone={demande.metier?.icon} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{demande.metier?.label} · {noms.get(demande.id) || 'Client'}</p>
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <CalendarDays className="h-4 w-4 text-brand" strokeWidth={2.5} aria-hidden="true" />
              {libelleJour(demande.service_date)} · <span className="font-bold text-accent">{price} DH</span>
            </p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Link to={`/artisan/messages?demande=${demande.id}`} aria-label="Messages"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line text-brand hover:border-brand">
              <MessagesSquare className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
            </Link>
            <Link to={`/artisan/demandes/${demande.id}`}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-brand px-4 font-bold text-white hover:bg-brand-dark sm:flex-none">
              Voir
            </Link>
          </div>
        </li>
      ))}
    </ul>
  )
}

function DernieresDemandes({ demandes }) {
  if (demandes.length === 0) {
    return <p className="text-muted">Aucune demande ouverte ne correspond à vos métiers pour le moment.</p>
  }
  return (
    <ul className="flex flex-col gap-2">
      {demandes.slice(0, 3).map((d) => (
        <li key={d.id}>
          <Link to={`/artisan/demandes/${d.id}`} className="flex items-center gap-3 rounded-xl border border-line p-3 hover:border-brand">
            <IconeMetier icone={d.metier.icon} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{d.metier.label}</p>
              <p className="truncate text-sm text-muted">
                {[d.district, libelleJour(d.service_date)].filter(Boolean).join(' · ')} · {d.nbOffres} offre{d.nbOffres > 1 ? 's' : ''}
              </p>
            </div>
            <span className="shrink-0 font-display font-bold text-accent">
              {d.proposed_price ? `${d.proposed_price} DH` : 'Devis'}
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-brand" strokeWidth={2.5} aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

function CarteProfil({ profil, metiers, surMiseAJour }) {
  return (
    <Carte titre="Mon profil">
      <div className="flex items-center gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand font-display text-xl font-bold text-white" aria-hidden="true">
          {profil.full_name.trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold text-brand">{profil.full_name}</p>
          <p className="flex items-center gap-1.5 text-muted">
            <Epingle className="h-5 w-4" />
            {[profil.district, 'Casablanca'].filter(Boolean).join(', ')}
          </p>
        </div>
      </div>
      {profil.trades.length > 0 && (
        <ul aria-label="Mes métiers" className="flex flex-wrap gap-2">
          {profil.trades.map((id) => {
            const metier = metiers.find((m) => m.id === id)
            if (!metier) return null
            return (
              <li key={id} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface py-1 pl-1 pr-3 text-sm font-bold">
                <IconeMetier icone={metier.icon} petit />
                {metier.label}
              </li>
            )
          })}
        </ul>
      )}
      <Disponibilite profil={profil} surMiseAJour={surMiseAJour} />
      <div className="grid grid-cols-2 gap-2">
        <Link to="/artisan/profil" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-brand px-3 font-bold text-brand hover:bg-brand-light">
          <UserRound className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
          Mon profil
        </Link>
        <Link to="/artisan/parametres" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-line px-3 font-bold text-ink hover:border-brand">
          <Settings className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
          Paramètres
        </Link>
      </div>
    </Carte>
  )
}

// Crédit simulé (US15). RG13 : simulation, aucun argent réel, ni banque ni logo.
function CarteCredit({ credit }) {
  return (
    <Carte titre="Mon crédit" lien={<span className="rounded-full bg-accent-light px-2.5 py-0.5 text-sm font-bold text-accent">Simulation</span>}>
      {credit.erreur && <MessageErreur>{credit.erreur}</MessageErreur>}
      {!credit.erreur && credit.solde === undefined && <p className="text-muted">Chargement…</p>}
      {credit.solde !== undefined && (
        <>
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-light text-brand">
              <Wallet className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <p className={`font-display text-[28px] font-bold tabular-nums ${credit.solde < 0 ? 'text-danger' : 'text-ink'}`}>
              {credit.solde.toLocaleString('fr-FR')} DH
            </p>
          </div>
          {credit.mouvements.length === 0 ? (
            <p className="text-muted">Aucun mouvement pour l’instant.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {credit.mouvements.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                  <span>
                    <span className="block font-bold">{TYPES_MOUVEMENT[m.kind] ?? m.kind}</span>
                    <span className="text-sm text-muted">{dateCourte.format(new Date(m.created_at))}</span>
                  </span>
                  <span className={`font-bold tabular-nums ${m.amount < 0 ? 'text-danger' : 'text-ok'}`}>
                    {m.amount > 0 ? '+' : ''}{m.amount} DH
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm text-muted">
            Simulation de la démo : aucun argent réel. Le client vous paie en espèces, directement.
          </p>
        </>
      )}
    </Carte>
  )
}

// Tableau de bord de l'artisan : activité, profil et réglages, missions, demandes, crédit simulé.
export default function TableauBordArtisan({ profil, surMiseAJour }) {
  const sansMetier = profil.trades.length === 0
  const [fil, setFil] = useState({ demandes: null, erreur: '' })
  const [offres, setOffres] = useState({ liste: null, erreur: null })
  const [noms, setNoms] = useState(new Map())
  const [note, setNote] = useState({ chargee: false, valeur: null })
  const [metiers, setMetiers] = useState([])
  const [credit, setCredit] = useState({})
  const prenom = profil.full_name.trim().split(' ')[0]
  // Le fil dépend des métiers et de la disponibilité (RG05, RG12) : on le recharge s'ils changent
  const cleFil = `${profil.trades.join(',')}|${profil.available_today}`

  useEffect(() => {
    if (sansMetier) return
    let actif = true
    chargerFilArtisan().then((r) => { if (actif) setFil(r) })
    return () => { actif = false }
  }, [cleFil, sansMetier])

  useEffect(() => {
    chargerMesOffres(profil.id).then(({ offres: liste, erreur }) => setOffres({ liste: liste ?? [], erreur: erreur ?? null }))
    // Nom du client de chaque mission (les conversations le connaissent déjà)
    chargerConversations(profil).then(({ conversations }) => {
      if (conversations) setNoms(new Map(conversations.map((c) => [c.idDemande, c.nomAutre])))
    })
    supabase.from('artisan_ratings').select('average_score, ratings_count').eq('artisan_id', profil.id).maybeSingle()
      .then(({ data }) => setNote({ chargee: true, valeur: data ?? null }))
    supabase.from('trades').select('id, label, icon').eq('for_artisans', true)
      .then(({ data }) => setMetiers(data ?? []))
    chargerCredit(profil.id).then(setCredit)
    // Une seule fois par compte : basculer la disponibilité ne recharge pas tout le tableau de bord
  }, [profil.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const liste = offres.liste
  const missions = liste?.filter((o) => o.status === 'acceptee' && o.demande?.status === 'attribuee') ?? []
  const nbNouvelles = sansMetier ? 0 : fil.demandes?.length
  const compteurs = [
    [Inbox, 'Demandes pour vous', nbNouvelles],
    [Clock, 'Offres en attente', liste?.filter((o) => o.status === 'en_attente').length],
    [Handshake, 'Missions obtenues', liste?.filter((o) => o.status === 'acceptee').length],
    [Star, 'Ma note', note.chargee ? (texteNote(note.valeur)?.replace(' ★', '') ?? 'Nouveau') : undefined],
  ]

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-[28px] leading-tight">Bonjour {prenom}</h1>
        <p className="mt-1 text-muted">Voici un aperçu de votre activité sur Mawkaf.</p>
      </div>

      {sansMetier && (
        <div className="flex flex-col gap-3 rounded-card border border-sand-deep bg-sand p-4 sm:flex-row sm:items-center">
          <p className="flex-1">
            <span className="block font-display text-lg font-bold text-brand">Complétez votre profil</span>
            Choisissez au moins un métier pour voir les demandes des clients qui vous concernent.
          </p>
          <Link to="/artisan/profil" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-5 font-bold text-white shadow-press hover:bg-brand-dark">
            Compléter mon profil
          </Link>
        </div>
      )}

      <ul aria-label="Résumé" className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {compteurs.map(([icone, libelle, valeur]) => (
          <Tuile key={libelle} icone={icone} libelle={libelle} valeur={valeur} />
        ))}
      </ul>

      <div className="grid items-start gap-5 md:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-5">
          <Carte titre="Missions en cours" lien={<LienVoirTout to="/artisan/offres">Mes offres</LienVoirTout>}>
            <MessageErreur>{offres.erreur}</MessageErreur>
            {!liste && !offres.erreur && <p className="text-muted">Chargement…</p>}
            {liste && <Missions missions={missions} noms={noms} />}
          </Carte>

          {!sansMetier && (
            <Carte titre="Dernières demandes pour vous" lien={<LienVoirTout to="/artisan/fil">Voir tout le fil</LienVoirTout>}>
              <MessageErreur>{fil.erreur}</MessageErreur>
              {!fil.demandes && !fil.erreur && <p className="text-muted">Chargement…</p>}
              {fil.demandes && <DernieresDemandes demandes={fil.demandes} />}
            </Carte>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <CarteProfil profil={profil} metiers={metiers} surMiseAJour={surMiseAJour} />
          <CarteCredit credit={credit} />
        </div>
      </div>
    </section>
  )
}
