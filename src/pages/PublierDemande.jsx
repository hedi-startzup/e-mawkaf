import { createElement, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight, Banknote, CalendarDays, Check, ChevronDown, Clock, House, MapPinned, Moon, Pencil, Send, Sun, Sunrise, Sunset } from 'lucide-react'
import { Epingle } from '../components/Marque'
import { Bouton, Champ, Choix, MessageErreur, Titre } from '../components/ui'
import { ADRESSE_MAX, chargerAdresseMaison, erreurAdresse } from '../lib/adresses'
import { CRENEAUX, aujourdhuiCasablanca, demainCasablanca } from '../lib/dates'
import { chargerMetiersDemande, publierDemande } from '../lib/demandes'
import { iconeMetier } from '../lib/icones'
import { VILLES, arrondissementsDe } from '../lib/quartiers'
import { useSession } from '../lib/session'
import {
  DESCRIPTION_MAX, QUARTIER_MAX, erreurArrondissement, erreurCreneau, erreurDescription, erreurMetier,
  erreurPrixFacultatif, erreurQuartier,
} from '../lib/validation'

const JOURS = [
  { valeur: 'aujourdhui', label: "Aujourd'hui", icone: Sun },
  { valeur: 'demain', label: 'Demain', icone: Sunrise },
]

// US20 : créneau de l'intervention
const CHOIX_CRENEAUX = [
  { valeur: 'matin', label: CRENEAUX.matin, icone: Sunrise },
  { valeur: 'apres_midi', label: CRENEAUX.apres_midi, icone: Sunset },
  { valeur: 'soir', label: CRENEAUX.soir, icone: Moon },
]

const ETAPES = ['Détails', 'Date & prix', 'Récapitulatif']

// US26 : adresse enregistrée (« Maison ») ou autre adresse pour cette demande seulement
const TYPES_ADRESSE = [
  { valeur: 'maison', label: 'Maison', icone: House },
  { valeur: 'autre', label: 'Autre adresse', icone: MapPinned },
]

// Champs vérifiés à chaque étape, avec leur fonction de validation (src/lib/validation.js)
const VERIFICATIONS = {
  1: {
    metier: erreurMetier, description: erreurDescription, arrondissement: erreurArrondissement, quartier: erreurQuartier,
    adresse: erreurAdresse,
  },
  2: { creneau: erreurCreneau, prix: erreurPrixFacultatif },
}

function MessageChamp({ id, children }) {
  if (!children) return null
  return <p id={id} role="alert" className="font-bold text-danger">{children}</p>
}

// Indicateur d'étapes de la maquette : 1 Détails · 2 Date & prix · 3 Récapitulatif
function Etapes({ etape }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Étapes">
      {ETAPES.map((libelle, i) => {
        const numero = i + 1
        const faite = numero < etape
        const active = numero === etape
        return (
          <li key={libelle} className="flex min-w-0 flex-1 items-center gap-2" aria-current={active ? 'step' : undefined}>
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                active ? 'bg-brand text-white' : faite ? 'bg-ok text-white' : 'bg-gray-light text-muted'
              }`}
            >
              {faite ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> : numero}
            </span>
            <span className={`truncate text-sm font-bold ${active ? 'text-brand' : 'text-muted'} ${active ? '' : 'hidden sm:inline'}`}>
              {libelle}
            </span>
            {numero < ETAPES.length && <span className="h-0.5 min-w-3 flex-1 rounded-full bg-line" aria-hidden="true" />}
          </li>
        )
      })}
    </ol>
  )
}

// Ligne du récapitulatif avec un bouton pour revenir modifier l'étape concernée
function LigneRecap({ libelle, children, surModifier }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-bold text-muted">{libelle}</p>
        <div className="mt-0.5 break-words">{children}</div>
      </div>
      <button
        type="button"
        onClick={surModifier}
        className="inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-xl px-3 font-bold text-brand hover:bg-brand-light"
      >
        <Pencil className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
        Modifier
      </button>
    </div>
  )
}

// Publier une demande (US05) en 3 étapes (maquette n°5) : métier, description, lieu,
// puis jour et prix facultatif (RG04), puis récapitulatif. Les règles et l'envoi ne changent pas.
export default function PublierDemande() {
  const { profil } = useSession()
  const navigate = useNavigate()
  const [metiers, setMetiers] = useState([])
  const [erreurMetiers, setErreurMetiers] = useState(null)
  const [etape, setEtape] = useState(1)
  const [form, setForm] = useState({
    metier: '', description: '', ville: profil.city || 'Casablanca', arrondissement: '', quartier: '', jour: 'aujourdhui', creneau: '', prix: '',
    typeAdresse: 'maison', adresse: '',
  })
  // Adresse « Maison » enregistrée dans Paramètres (vide si le client n'en a pas encore)
  const [adresseMaison, setAdresseMaison] = useState('')
  const [erreurs, setErreurs] = useState({})
  const [erreurGenerale, setErreurGenerale] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  // Heure d'arrivée sur une étape : évite qu'un double-clic sur « Continuer » publie aussitôt
  const arrivee = useRef(0)

  useEffect(() => {
    chargerMetiersDemande().then(({ metiers: liste, erreur }) => {
      if (erreur) setErreurMetiers(erreur)
      else setMetiers(liste)
    })
  }, [])

  useEffect(() => {
    chargerAdresseMaison(profil.id).then(({ adresse }) => {
      if (!adresse) return
      setAdresseMaison(adresse)
      setForm((f) => (f.typeAdresse === 'maison' && !f.adresse ? { ...f, adresse } : f))
    })
  }, [profil.id])

  // « Maison » reprend l'adresse enregistrée ; « Autre adresse » part d'un champ vide
  function choisirTypeAdresse(type) {
    setForm((f) => ({ ...f, typeAdresse: type, adresse: type === 'maison' ? adresseMaison : '' }))
    setErreurs((e) => ({ ...e, adresse: null }))
  }

  function changer(champ, valeur) {
    setForm((f) => ({ ...f, [champ]: valeur }))
    setErreurs((e) => ({ ...e, [champ]: null }))
  }

  function allerA(numero) {
    arrivee.current = Date.now()
    setEtape(numero)
    window.scrollTo({ top: 0 })
  }

  // Vérifie les champs d'une étape ; renvoie vrai s'il n'y a aucune erreur
  function etapeValide(numero) {
    const e = Object.fromEntries(
      Object.entries(VERIFICATIONS[numero]).map(([champ, verifier]) => [champ, verifier(form[champ])]),
    )
    // US17 : l'arrondissement n'est demandé que pour les villes qui en ont
    if (numero === 1 && arrondissementsDe(form.ville).length === 0) e.arrondissement = null
    setErreurs((x) => ({ ...x, ...e }))
    return !Object.values(e).some(Boolean)
  }

  async function envoyer(evenement) {
    evenement.preventDefault()
    setErreurGenerale(null)
    if (etape < 3) {
      if (etapeValide(etape)) allerA(etape + 1)
      return
    }
    if (Date.now() - arrivee.current < 600) return
    // Dernière vérification de tout le formulaire avant l'envoi
    if (!etapeValide(1)) return allerA(1)
    if (!etapeValide(2)) return allerA(2)

    setEnvoi(true)
    const { erreur } = await publierDemande({
      ...form,
      idClient: profil.id,
      jour: form.jour === 'demain' ? demainCasablanca() : aujourdhuiCasablanca(),
      // « Maison » choisie sans adresse enregistrée : on l'enregistre pour la prochaine fois
      enregistrerMaison: form.typeAdresse === 'maison' && !adresseMaison,
    })
    setEnvoi(false)
    if (erreur) return setErreurGenerale(erreur)
    navigate('/client', { state: { demandePubliee: true } })
  }

  const longueur = form.description.trim().length
  const devis = !form.prix.trim()
  const metierChoisi = metiers.find((m) => m.id === form.metier)

  return (
    <section className="flex flex-col gap-6 md:mx-auto md:w-full md:max-w-2xl">
      <Link to="/client" className="inline-flex min-h-12 items-center gap-2 self-start font-bold text-brand">
        <ArrowLeft className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        Mes demandes
      </Link>
      <Titre sousTitre="Décrivez votre besoin et trouvez un artisan près de chez vous.">Créer une demande</Titre>

      <form onSubmit={envoyer} noValidate className="flex flex-col gap-8 rounded-card border border-line bg-white p-4 shadow-card md:p-8">
        <Etapes etape={etape} />

        {etape === 1 && (
          <>
            <div role="group" aria-labelledby="titre-metier" className="flex flex-col gap-3">
              <h2 id="titre-metier" className="text-xl">Quoi ?</h2>
              <MessageChamp>{erreurs.metier}</MessageChamp>
              <MessageChamp>{erreurMetiers}</MessageChamp>
              {!metiers.length && !erreurMetiers && <p className="text-muted">Chargement des métiers…</p>}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {metiers.map((metier) => {
                  const Icone = iconeMetier(metier.icon)
                  const choisi = form.metier === metier.id
                  return (
                    <button
                      key={metier.id}
                      type="button"
                      aria-pressed={choisi}
                      onClick={() => changer('metier', metier.id)}
                      className={`relative flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition-all active:scale-[0.97] ${
                        choisi ? 'border-brand bg-brand-light ring-1 ring-brand' : 'border-line bg-white hover:border-brand'
                      }`}
                    >
                      {choisi && (
                        <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-brand text-white">
                          <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                        </span>
                      )}
                      <span className={`grid h-12 w-12 place-items-center rounded-xl ${choisi ? 'bg-brand text-white' : 'bg-sand text-brand'}`}>
                        <Icone className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
                      </span>
                      <span className="font-bold leading-tight">{metier.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="flex items-end justify-between gap-3 font-bold">
                Décrivez votre besoin
                <span className="text-sm font-normal tabular-nums text-muted">{longueur} / {DESCRIPTION_MAX}</span>
              </label>
              <textarea
                id="description"
                rows={4}
                maxLength={DESCRIPTION_MAX}
                placeholder="Exemple : Fuite sous l'évier de la cuisine"
                value={form.description}
                aria-invalid={Boolean(erreurs.description)}
                onChange={(e) => changer('description', e.target.value)}
                className="champ h-auto py-3"
              />
              <MessageChamp>{erreurs.description}</MessageChamp>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-xl">Où ?</h2>
              <label className="flex flex-col gap-1.5">
                <span className="flex items-center gap-2 font-bold"><Epingle className="h-6 w-5" />Ville</span>
                <span className="relative">
                  <select
                    value={form.ville}
                    onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value, arrondissement: '' }))}
                    className="champ appearance-none pr-11"
                  >
                    {VILLES.map((nom) => <option key={nom} value={nom}>{nom}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand" strokeWidth={3} aria-hidden="true" />
                </span>
              </label>
              {arrondissementsDe(form.ville).length > 0 && (
                <label className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-2 font-bold"><Epingle className="h-6 w-5" />Arrondissement</span>
                  <span className="relative">
                    <select
                      value={form.arrondissement}
                      aria-invalid={Boolean(erreurs.arrondissement)}
                      onChange={(e) => changer('arrondissement', e.target.value)}
                      className="champ appearance-none pr-11"
                    >
                      <option value="">Choisir…</option>
                      {arrondissementsDe(form.ville).map((nom) => <option key={nom} value={nom}>{nom}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand" strokeWidth={3} aria-hidden="true" />
                  </span>
                  <MessageChamp>{erreurs.arrondissement}</MessageChamp>
                </label>
              )}
              <Champ id="quartier" label="Quartier (facultatif)" maxLength={QUARTIER_MAX} placeholder="Exemple : Racine"
                value={form.quartier} onChange={(e) => changer('quartier', e.target.value)} erreur={erreurs.quartier} />

              {/* US26 : adresse exacte, montrée seulement à l'artisan retenu, après attribution */}
              <Choix legende="Adresse de l'intervention" options={TYPES_ADRESSE} valeur={form.typeAdresse} onChange={choisirTypeAdresse} />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="adresse" className="flex items-end justify-between gap-3 font-bold">
                  {form.typeAdresse === 'maison' ? 'Mon adresse' : 'Adresse pour cette demande'}
                  <span className="text-sm font-normal tabular-nums text-muted">{form.adresse.trim().length} / {ADRESSE_MAX}</span>
                </label>
                <textarea
                  id="adresse"
                  rows={2}
                  maxLength={ADRESSE_MAX}
                  placeholder="Exemple : 12 rue Ibnou Mounir, immeuble B, 3e étage, appt 7"
                  value={form.adresse}
                  aria-invalid={Boolean(erreurs.adresse)}
                  onChange={(e) => changer('adresse', e.target.value)}
                  className="champ h-auto py-3"
                />
                <p className="text-muted">
                  {form.typeAdresse === 'maison' && !adresseMaison
                    ? 'Elle sera enregistrée pour vos prochaines demandes. '
                    : ''}
                  Seul l'artisan que vous choisirez la verra.
                </p>
                <MessageChamp>{erreurs.adresse}</MessageChamp>
              </div>
            </div>
          </>
        )}

        {etape === 2 && (
          <>
            <Choix legende="Pour quand ?" options={JOURS} valeur={form.jour} onChange={(v) => changer('jour', v)} />
            <Choix legende="À quel moment ?" options={CHOIX_CRENEAUX} valeur={form.creneau}
              onChange={(v) => changer('creneau', v)} erreur={erreurs.creneau} />

            <Champ id="prix" label="Prix proposé en DH (facultatif)" icone={Banknote} inputMode="numeric"
              placeholder="Exemple : 150" value={form.prix}
              aide={devis ? 'Laissez vide pour demander un devis : les artisans proposeront leur prix.' : 'Entre 50 et 5 000 DH.'}
              onChange={(e) => changer('prix', e.target.value.replace(/\s/g, ''))} erreur={erreurs.prix} />
          </>
        )}

        {etape === 3 && (
          <div className="flex flex-col">
            <h2 className="mb-1 text-xl">Vérifiez votre demande</h2>
            <LigneRecap libelle="Métier" surModifier={() => allerA(1)}>
              <span className="inline-flex items-center gap-2 font-bold">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-sand text-brand">
                  {createElement(iconeMetier(metierChoisi?.icon), { className: 'h-5 w-5', strokeWidth: 2.5, 'aria-hidden': true })}
                </span>
                {metierChoisi?.label}
              </span>
            </LigneRecap>
            <LigneRecap libelle="Description" surModifier={() => allerA(1)}>{form.description.trim()}</LigneRecap>
            <LigneRecap libelle="Lieu" surModifier={() => allerA(1)}>
              <span className="inline-flex items-center gap-1.5">
                <Epingle className="h-5 w-4" />
                {[form.quartier.trim(), form.arrondissement, form.ville].filter(Boolean).join(', ')}
              </span>
            </LigneRecap>
            <LigneRecap libelle="Adresse" surModifier={() => allerA(1)}>
              <span className="break-words">{form.adresse.trim()}</span>
            </LigneRecap>
            <LigneRecap libelle="Jour" surModifier={() => allerA(2)}>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-5 w-5 text-brand" strokeWidth={2.5} aria-hidden="true" />
                {form.jour === 'demain' ? 'Demain' : "Aujourd'hui"}
              </span>
            </LigneRecap>
            <LigneRecap libelle="Créneau" surModifier={() => allerA(2)}>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-5 w-5 text-brand" strokeWidth={2.5} aria-hidden="true" />
                {CRENEAUX[form.creneau]}
              </span>
            </LigneRecap>
            <LigneRecap libelle="Prix" surModifier={() => allerA(2)}>
              <span className="font-display text-lg font-bold text-accent">
                {devis ? 'Devis demandé' : `${form.prix.trim()} DH`}
              </span>
            </LigneRecap>
          </div>
        )}

        <MessageErreur>{erreurGenerale}</MessageErreur>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {etape > 1 && (
            <Bouton type="button" variante="secondaire" onClick={() => allerA(etape - 1)} className="inline-flex items-center justify-center gap-2 sm:w-auto">
              <ArrowLeft className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
              Retour
            </Bouton>
          )}
          {etape < 3 ? (
            <Bouton type="submit" className="inline-flex items-center justify-center gap-2">
              Continuer
              <ArrowRight className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
            </Bouton>
          ) : (
            <Bouton type="submit" disabled={envoi} className="inline-flex items-center justify-center gap-2">
              <Send className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
              {envoi ? 'Publication…' : devis ? 'Demander des devis' : 'Publier ma demande'}
            </Bouton>
          )}
        </div>
      </form>
    </section>
  )
}
