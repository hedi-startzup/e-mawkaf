import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, CalendarDays, Check, Star, Sun } from 'lucide-react'
import BoutonActualiser from '../components/BoutonActualiser'
import Cloture from '../components/Cloture'
import { Epingle, Etoile } from '../components/Marque'
import MiseEnRelation from '../components/MiseEnRelation'
import { Avatar } from '../components/PhotoProfil'
import { libelleJour } from '../lib/dates'
import { STATUTS_DEMANDE, chargerDetailDemande, choisirOffre, texteNote } from '../lib/demandes'
import { iconeMetier } from '../lib/icones'
import { STATUTS_OFFRE } from '../lib/offres'
import { useSession } from '../lib/session'
import { useTempsReel } from '../lib/tempsReel'

function prenomDe(nomComplet) {
  return (nomComplet ?? '').trim().split(' ')[0] || 'Artisan'
}

function Pastille({ statut }) {
  return <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${statut.classes}`}>{statut.label}</span>
}

function ResumeDemande({ demande }) {
  const Icone = iconeMetier(demande.metier?.icon)
  const lieu = [demande.neighborhood, demande.district].filter(Boolean).join(', ')
  return (
    <div className="flex flex-col gap-3 rounded-card border border-sand-deep bg-sand p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-brand">
          <Icone className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 font-display text-lg font-bold text-brand">{demande.metier?.label}</span>
        <Pastille statut={STATUTS_DEMANDE[demande.status] ?? STATUTS_DEMANDE.ouverte} />
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
      <p className="font-display text-lg font-bold text-ink">
        Votre prix : {demande.proposed_price ? `${demande.proposed_price} DH` : 'devis demandé'}
      </p>
    </div>
  )
}

function CarteOffre({ offre, choixPossible, surChoisie }) {
  const [confirmation, setConfirmation] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)
  const prenom = prenomDe(offre.artisan.full_name)
  const note = texteNote(offre.note)
  const acceptee = offre.status === 'acceptee'

  async function choisir() {
    setEnvoi(true)
    setErreur(null)
    const { erreur: e } = await choisirOffre(offre.id)
    setEnvoi(false)
    if (e) return setErreur(e)
    surChoisie()
  }

  return (
    <li className={`flex flex-col gap-3 rounded-card border-2 bg-white p-4 shadow-card ${acceptee ? 'border-ok' : 'border-line'}`}>
      <div className="flex items-start justify-between gap-3">
        {/* US23 : le client voit qui va venir */}
        <Avatar chemin={offre.artisan.avatar_path} nom={prenom} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl font-bold text-brand">{prenom}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {note ? (
              <span className="inline-flex items-center gap-1 font-bold">
                <Star className="h-4 w-4 fill-accent text-accent" aria-hidden="true" />
                {note.replace(' ★', '')}
              </span>
            ) : (
              <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-sm font-bold text-brand">Nouveau</span>
            )}
            {offre.artisan.available_today && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ok-light px-2.5 py-0.5 text-sm font-bold text-ok">
                <Sun className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                Disponible aujourd'hui
              </span>
            )}
          </div>
        </div>
        <p className="shrink-0 font-display text-2xl font-bold text-accent">{offre.price} DH</p>
      </div>

      {offre.message && <p className="break-words rounded-xl bg-gray-light px-3 py-2">« {offre.message} »</p>}

      {!choixPossible && offre.status !== 'en_attente' && (
        <div><Pastille statut={STATUTS_OFFRE[offre.status] ?? STATUTS_OFFRE.en_attente} /></div>
      )}

      {choixPossible && !confirmation && (
        <button
          type="button"
          onClick={() => setConfirmation(true)}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-lg font-bold text-white shadow-press hover:bg-brand-dark active:scale-[0.98]"
        >
          <Check className="h-6 w-6" strokeWidth={3} aria-hidden="true" />
          Choisir cette offre
        </button>
      )}

      {choixPossible && confirmation && (
        <div role="group" aria-label="Confirmer le choix" className="flex flex-col gap-3 rounded-xl border-2 border-brand bg-brand-light p-3">
          <p className="font-bold">Choisir {prenom} à {offre.price} DH ? Les autres offres seront refusées.</p>
          {erreur && <p role="alert" className="font-bold text-danger">{erreur}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={envoi}
              onClick={choisir}
              className="min-h-12 rounded-xl bg-brand px-4 font-bold text-white active:scale-[0.98] disabled:opacity-60"
            >
              {envoi ? 'Choix…' : 'Oui, choisir'}
            </button>
            <button
              type="button"
              disabled={envoi}
              onClick={() => { setConfirmation(false); setErreur(null) }}
              className="min-h-12 rounded-xl border-2 border-brand bg-white px-4 font-bold text-brand"
            >
              Non
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

// Détail d'une demande du client : comparer les offres et en choisir une (US09, RG07, RG11)
export default function DetailDemande() {
  const { id } = useParams()
  const [etat, setEtat] = useState({ chargement: true })

  const charger = useCallback(() => {
    chargerDetailDemande(id).then((resultat) => setEtat({ chargement: false, ...resultat }))
  }, [id])

  useEffect(() => { charger() }, [charger])

  // US10 : la liste se met à jour seule quand une offre arrive, change ou est retirée
  useTempsReel(`client-demande-${id}`, [
    { table: 'offers', filter: `request_id=eq.${id}` },
    { table: 'requests', filter: `id=eq.${id}` },
  ], charger)

  const { profil } = useSession()
  const { chargement, erreur, demande, offres, maNote } = etat
  const choixPossible = demande?.status === 'ouverte'
  const offreChoisie = offres?.find((o) => o.status === 'acceptee')

  return (
    <section className="flex flex-col gap-5 md:mx-auto md:w-full md:max-w-2xl">
      <Link to="/client" className="inline-flex min-h-12 items-center gap-2 self-start font-bold text-brand">
        <ArrowLeft className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        Mes demandes
      </Link>

      {chargement && <p className="text-muted">Chargement…</p>}
      {erreur && <p role="alert" className="font-bold text-danger">{erreur}</p>}

      {demande && (
        <>
          <ResumeDemande demande={demande} />

          {offreChoisie && (
            <p role="status" className="flex items-center gap-1.5 rounded-xl bg-ok-light px-3 py-2 font-bold text-ok">
              <Check className="h-5 w-5 shrink-0" strokeWidth={3} aria-hidden="true" />
              Vous avez choisi {prenomDe(offreChoisie.artisan.full_name)} à {offreChoisie.price} DH.
            </p>
          )}

          {/* US11 : après attribution, le client obtient le contact de l'artisan retenu */}
          {offreChoisie && ['attribuee', 'terminee'].includes(demande.status) && (
            <MiseEnRelation idAutre={offreChoisie.artisan.id} role="client" demande={demande} prix={offreChoisie.price} />
          )}

          {/* US12 : terminer l'intervention, puis noter l'artisan */}
          <Cloture demande={demande} offreChoisie={offreChoisie} maNote={maNote} idClient={profil.id}
            prenom={prenomDe(offreChoisie?.artisan.full_name)} surChangement={charger} />

          <h1 className="text-[28px] leading-tight">
            {offres.length === 0 ? 'Offres reçues' : `${offres.length} offre${offres.length > 1 ? 's' : ''} reçue${offres.length > 1 ? 's' : ''}`}
          </h1>
          {choixPossible && offres.length > 1 && <p className="-mt-3 text-muted">Du prix le plus bas au plus haut.</p>}
          <BoutonActualiser onClick={charger} />

          {offres.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-8 text-center">
              <Etoile className="mb-5 h-28 w-28 text-sand-deep" />
              <p className="font-display text-[22px] font-bold text-brand">Pas encore d'offre</p>
              <p className="mt-2 text-muted">Les artisans de votre secteur voient votre demande. Revenez dans un moment.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {offres.map((offre) => (
                <CarteOffre key={offre.id} offre={offre} choixPossible={choixPossible} surChoisie={charger} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
