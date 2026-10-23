import { createElement, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Banknote, CalendarDays, Camera, Check, MessageSquareText, Pencil, Send, Undo2, X } from 'lucide-react'
import BoutonActualiser from '../components/BoutonActualiser'
import { Epingle } from '../components/Marque'
import MiseEnRelation from '../components/MiseEnRelation'
import { Bouton, Champ, MessageErreur } from '../components/ui'
import { libelleJourCreneau } from '../lib/dates'
import { iconeMetier } from '../lib/icones'
import { STATUTS_OFFRE, chargerDemandeEtMonOffre, envoyerOffre, retirerOffre } from '../lib/offres'
import { useSession } from '../lib/session'
import { useTempsReel } from '../lib/tempsReel'
import { MESSAGE_OFFRE_MAX, erreurMessageOffre, erreurPrixOffre } from '../lib/validation'

// Page d'une demande côté artisan (US08) : accepter le prix du client,
// proposer un autre prix, ou modifier / retirer son offre tant que la demande est ouverte (RG06).
export default function DemandeArtisan() {
  const { id } = useParams()
  const { profil } = useSession()
  const [etat, setEtat] = useState({ id: null, demande: null, offre: null, erreur: null })
  const [version, setVersion] = useState(0) // +1 = recharger après un envoi

  useEffect(() => {
    let actif = true
    chargerDemandeEtMonOffre(id, profil.id).then((r) => {
      if (actif) setEtat({ id: `${id}|${version}`, demande: null, offre: null, erreur: null, ...r })
    })
    return () => {
      actif = false
    }
  }, [id, profil.id, version])

  // US10 : l'artisan voit son offre passer en « Acceptée » ou « Refusée » sans recharger
  useTempsReel(`artisan-demande-${id}`, [
    { table: 'offers', filter: `request_id=eq.${id}` },
    { table: 'requests', filter: `id=eq.${id}` },
  ], () => setVersion((v) => v + 1))

  // Pendant un rechargement, on garde l'écran affiché (pas de « Chargement… » à chaque mise à jour)
  const chargement = !etat.id?.startsWith(`${id}|`)
  const { demande, offre, erreur } = etat

  return (
    <section className="flex flex-col gap-6 md:mx-auto md:w-full md:max-w-2xl">
      <Link to="/artisan/fil" className="inline-flex min-h-12 items-center gap-2 self-start font-bold text-brand">
        <ArrowLeft className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        Mon fil
      </Link>

      {chargement && <p className="text-muted">Chargement…</p>}
      {!chargement && erreur && <MessageErreur>{erreur}</MessageErreur>}
      {!chargement && demande && (
        <>
          <Resume demande={demande} />
          <BoutonActualiser onClick={() => setVersion((v) => v + 1)} />
          <Offre
            key={`${offre?.id ?? 'nouvelle'}|${offre?.status}|${offre?.updated_at}`}
            demande={demande}
            offre={offre}
            idArtisan={profil.id}
            aPhoto={Boolean(profil.avatar_path)}
            surEnvoi={() => setVersion((v) => v + 1)}
          />
        </>
      )}
    </section>
  )
}

function Resume({ demande }) {
  const lieu = [demande.neighborhood, demande.district].filter(Boolean).join(', ') || 'Casablanca'
  const n = demande.nbOffres
  return (
    <article className="flex flex-col gap-3 rounded-card border border-line bg-white p-4 shadow-card">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sand text-brand">
          {createElement(iconeMetier(demande.metier?.icon), {
            className: 'h-6 w-6',
            strokeWidth: 2.5,
            'aria-hidden': true,
          })}
        </span>
        <h1 className="text-2xl">{demande.metier?.label}</h1>
      </div>
      <p className="break-words text-lg">{demande.description}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <Epingle className="h-5 w-4" />
          <span className="truncate">{lieu}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-5 w-5 text-brand" strokeWidth={2.5} aria-hidden="true" />
          {libelleJourCreneau(demande.service_date, demande.time_slot)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MessageSquareText className="h-5 w-5 text-brand" strokeWidth={2.5} aria-hidden="true" />
          {n === 0 ? 'Aucune offre' : `${n} offre${n > 1 ? 's' : ''}`}
        </span>
      </div>
      <p className="font-display text-xl font-bold text-accent">
        {demande.proposed_price ? `Prix proposé : ${demande.proposed_price} DH` : 'Devis demandé'}
      </p>
    </article>
  )
}

function Offre({ demande, offre, idArtisan, aPhoto, surEnvoi }) {
  const ouverte = demande.status === 'ouverte'
  const enAttente = offre?.status === 'en_attente'
  // Mode « formulaire » : demande de devis, ou artisan qui modifie / propose un autre prix
  const [formulaire, setFormulaire] = useState(false)
  const [prix, setPrix] = useState(offre ? String(offre.price) : '')
  const [message, setMessage] = useState(offre?.message ?? '')
  const [erreurs, setErreurs] = useState({})
  const [erreurGenerale, setErreurGenerale] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [confirmerRetrait, setConfirmerRetrait] = useState(false)

  async function envoyer(prixEnvoye) {
    setErreurGenerale(null)
    const e = { prix: erreurPrixOffre(prixEnvoye), message: erreurMessageOffre(message) }
    setErreurs(e)
    if (e.prix || e.message) return
    setEnvoi(true)
    const { erreur } = await envoyerOffre({
      idDemande: demande.id,
      idArtisan,
      offreExistante: offre,
      prix: prixEnvoye,
      message,
    })
    setEnvoi(false)
    if (erreur) return setErreurGenerale(erreur)
    surEnvoi()
  }

  async function retirer() {
    setEnvoi(true)
    const { erreur } = await retirerOffre(offre.id)
    setEnvoi(false)
    if (erreur) return setErreurGenerale(erreur)
    surEnvoi()
  }

  // Offre déjà envoyée (en attente, acceptée ou refusée) : on l'affiche
  if (offre && offre.status !== 'retiree' && !formulaire) {
    const statut = STATUTS_OFFRE[offre.status]
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 rounded-card border-2 border-brand bg-brand-light p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl">Votre offre</h2>
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${statut.classes}`}>{statut.label}</span>
          </div>
          <p className="font-display text-2xl font-bold text-brand">{offre.price} DH</p>
          {offre.message && <p className="break-words">« {offre.message} »</p>}
        </div>
        {/* US11 : après attribution, l'artisan retenu obtient le contact du client */}
        {offre.status === 'acceptee' && (
          <MiseEnRelation idAutre={demande.client_id} role="artisan" demande={demande} prix={offre.price} />
        )}
        <MessageErreur>{erreurGenerale}</MessageErreur>
        {ouverte && enAttente && !confirmerRetrait && (
          <>
            <Bouton type="button" onClick={() => setFormulaire(true)} className="inline-flex items-center justify-center gap-2">
              <Pencil className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
              Modifier mon offre
            </Bouton>
            <Bouton
              type="button"
              variante="secondaire"
              onClick={() => setConfirmerRetrait(true)}
              className="inline-flex items-center justify-center gap-2"
            >
              <X className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
              Retirer mon offre
            </Bouton>
          </>
        )}
        {confirmerRetrait && (
          <div className="flex flex-col gap-3 rounded-card border-2 border-danger bg-white p-4">
            <p className="font-bold">Retirer votre offre ? Le client ne la verra plus.</p>
            <Bouton
              type="button"
              disabled={envoi}
              onClick={retirer}
              className="bg-danger! inline-flex items-center justify-center gap-2"
            >
              {envoi ? 'Retrait…' : 'Oui, retirer mon offre'}
            </Bouton>
            <Bouton type="button" variante="secondaire" onClick={() => setConfirmerRetrait(false)}>
              Non, la garder
            </Bouton>
          </div>
        )}
        {!ouverte && <p className="text-muted">Cette demande n'est plus ouverte : votre offre ne peut plus changer.</p>}
      </div>
    )
  }

  if (!ouverte) {
    return <p className="text-muted">Cette demande n'est plus ouverte : vous ne pouvez plus faire d'offre.</p>
  }

  // US23 : pas de photo, pas d'offre (la base le refuse aussi)
  if (!aPhoto) {
    return (
      <div className="flex flex-col gap-4 rounded-card border-2 border-brand bg-brand-light p-4">
        <div className="flex items-start gap-3">
          <Camera className="mt-0.5 h-6 w-6 shrink-0 text-brand" strokeWidth={2.5} aria-hidden="true" />
          <p className="font-bold">Ajoutez une photo de profil pour faire une offre : le client veut savoir qui va venir.</p>
        </div>
        <Link
          to="/artisan/profil"
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-lg font-bold text-white shadow-press hover:bg-brand-dark active:scale-[0.98]"
        >
          Ajouter ma photo
        </Link>
      </div>
    )
  }

  const avecPrix = Boolean(demande.proposed_price)
  const afficherPrix = formulaire || !avecPrix

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl">
        {offre?.status === 'retiree' ? 'Faire une nouvelle offre' : formulaire && offre ? 'Modifier mon offre' : 'Votre offre'}
      </h2>

      {afficherPrix && (
        <Champ
          id="prix"
          label="Votre prix en DH"
          icone={Banknote}
          inputMode="numeric"
          placeholder="Exemple : 250"
          value={prix}
          aide="Entre 50 et 5 000 DH, sans centimes."
          onChange={(e) => {
            setPrix(e.target.value.replace(/\s/g, ''))
            setErreurs((x) => ({ ...x, prix: null }))
          }}
          erreur={erreurs.prix}
        />
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="flex items-end justify-between gap-3 font-bold">
          <span>
            Message au client <span className="font-normal text-muted">(facultatif)</span>
          </span>
          <span className="text-sm font-normal tabular-nums text-muted">
            {message.length} / {MESSAGE_OFFRE_MAX}
          </span>
        </label>
        <textarea
          id="message"
          rows={3}
          maxLength={MESSAGE_OFFRE_MAX}
          placeholder="Exemple : Je peux venir dès 14 h avec le matériel."
          value={message}
          aria-invalid={Boolean(erreurs.message)}
          onChange={(e) => {
            setMessage(e.target.value)
            setErreurs((x) => ({ ...x, message: null }))
          }}
          className="champ h-auto py-3"
        />
        {erreurs.message && <p className="font-bold text-danger">{erreurs.message}</p>}
      </div>

      <MessageErreur>{erreurGenerale}</MessageErreur>

      {afficherPrix ? (
        <>
          <Bouton
            type="button"
            disabled={envoi}
            onClick={() => envoyer(prix)}
            className="inline-flex items-center justify-center gap-2"
          >
            <Send className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
            {envoi ? 'Envoi…' : avecPrix ? 'Envoyer mon prix' : 'Proposer ce prix'}
          </Bouton>
          {(avecPrix || offre) && (
            <Bouton
              type="button"
              variante="secondaire"
              onClick={() => {
                setFormulaire(false)
                setErreurs({})
                setPrix(offre ? String(offre.price) : '')
              }}
              className="inline-flex items-center justify-center gap-2"
            >
              <Undo2 className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
              Annuler
            </Bouton>
          )}
        </>
      ) : (
        <>
          <Bouton
            type="button"
            disabled={envoi}
            onClick={() => envoyer(String(demande.proposed_price))}
            className="inline-flex items-center justify-center gap-2"
          >
            <Check className="h-6 w-6" strokeWidth={3} aria-hidden="true" />
            {envoi ? 'Envoi…' : `Accepter ${demande.proposed_price} DH`}
          </Bouton>
          <Bouton
            type="button"
            variante="secondaire"
            onClick={() => setFormulaire(true)}
            className="inline-flex items-center justify-center gap-2"
          >
            <Pencil className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
            Proposer un autre prix
          </Bouton>
        </>
      )}
    </div>
  )
}
