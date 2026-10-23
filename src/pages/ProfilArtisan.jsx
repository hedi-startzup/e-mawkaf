import { useEffect, useState } from 'react'
import { AlertCircle, Check, ChevronDown, Save, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { VILLES, arrondissementsDe } from '../lib/quartiers'
import { iconeMetier } from '../lib/icones'
import { texteNote } from '../lib/demandes'
import { Epingle } from '../components/Marque'
import Disponibilite from '../components/Disponibilite'
import { Avatar, ChoixPhoto } from '../components/PhotoProfil'

const METIERS_MAX = 3
const QUARTIER_MAX = 60
const VOISINES_MAX = 5 // US27 : villes voisines où l'artisan accepte d'aller

// Message d'erreur sous un champ : dit ce qui ne va pas et comment corriger.
function Erreur({ children }) {
  if (!children) return null
  return (
    <p role="alert" className="flex items-start gap-1.5 font-bold text-danger">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

// Profil de l'artisan (US04) : métiers (1 à 3, RG03), secteur, disponibilité (RG12, composant Disponibilite).
export default function ProfilArtisan({ profil, surMiseAJour }) {
  const [metiers, setMetiers] = useState([])
  const [chargementMetiers, setChargementMetiers] = useState(true)
  const [choisis, setChoisis] = useState(profil.trades)
  const [ville, setVille] = useState(profil.city || 'Casablanca')
  const [arrondissement, setArrondissement] = useState(profil.district ?? '')
  const [quartier, setQuartier] = useState(profil.neighborhood ?? '')
  const [voisines, setVoisines] = useState(profil.nearby_cities ?? [])
  const [erreurs, setErreurs] = useState({})
  const [message, setMessage] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [note, setNote] = useState(null)

  // Liste des métiers proposés aux artisans : jamais « Autre » (for_artisans = faux).
  useEffect(() => {
    supabase
      .from('trades')
      .select('id, label, icon')
      .eq('is_active', true)
      .eq('for_artisans', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (error) {
          setErreurs({ chargement: 'Impossible de charger la liste des métiers. Rechargez la page.' })
        } else {
          setMetiers(data)
        }
        setChargementMetiers(false)
      })
  }, [])

  // Note de l'artisan (RG11) : moyenne et nombre d'avis, « Nouveau » s'il n'en a aucun
  useEffect(() => {
    supabase
      .from('artisan_ratings')
      .select('average_score, ratings_count')
      .eq('artisan_id', profil.id)
      .maybeSingle()
      .then(({ data }) => setNote(data ?? null))
  }, [profil.id])

  function basculerMetier(id) {
    setMessage('')
    setErreurs((actuelles) => ({ ...actuelles, metiers: undefined }))
    setChoisis((actuels) => {
      if (actuels.includes(id)) return actuels.filter((m) => m !== id)
      if (actuels.length >= METIERS_MAX) return actuels
      return [...actuels, id]
    })
  }

  function basculerVoisine(nom) {
    setMessage('')
    setVoisines((actuelles) => {
      if (actuelles.includes(nom)) return actuelles.filter((v) => v !== nom)
      if (actuelles.length >= VOISINES_MAX) return actuelles
      return [...actuelles, nom]
    })
  }

  async function enregistrer(e) {
    e.preventDefault()
    setMessage('')
    const nouvellesErreurs = {}
    if (choisis.length === 0) {
      nouvellesErreurs.metiers = 'Métiers : touchez au moins 1 métier (3 au maximum).'
    }
    // US17 : l'arrondissement n'est demandé que pour les villes qui en ont
    if (!arrondissement && arrondissementsDe(ville).length > 0) {
      nouvellesErreurs.arrondissement = 'Arrondissement : choisissez-en un dans la liste.'
    }
    if (quartier.trim().length > QUARTIER_MAX) {
      nouvellesErreurs.quartier = `Quartier : ${QUARTIER_MAX} caractères au maximum.`
    }
    setErreurs(nouvellesErreurs)
    if (Object.keys(nouvellesErreurs).length > 0) return

    setEnvoi(true)
    const modifications = {
      trades: choisis,
      city: ville,
      district: arrondissement || null,
      neighborhood: quartier.trim() || null,
      nearby_cities: voisines.filter((v) => v !== ville), // jamais sa propre ville
    }
    const { error } = await supabase.from('profiles').update(modifications).eq('id', profil.id)
    setEnvoi(false)
    if (error) {
      setErreurs({ envoi: "Votre profil n'a pas pu être enregistré. Réessayez dans un instant." })
      return
    }
    surMiseAJour({ ...profil, ...modifications })
    setMessage('Profil enregistré.')
  }

  const limiteAtteinte = choisis.length >= METIERS_MAX
  const dispo = profil.available_today

  return (
    <section className="flex flex-col gap-8 md:mx-auto md:w-full md:max-w-2xl">
      <h1 className="text-[28px] leading-tight">Mon profil</h1>

      {/* Carte d'en-tête du profil (maquette n°7) : ce que voit un client */}
      <div className="flex flex-col gap-4 rounded-card border border-line bg-white p-5 shadow-card">
        <div className="flex items-center gap-4">
          <Avatar chemin={profil.avatar_path} nom={profil.full_name} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-display text-xl font-bold text-brand">{profil.full_name}</p>
              {dispo && (
                <span className="rounded-full bg-ok-light px-2.5 py-0.5 text-sm font-bold text-ok">Disponible</span>
              )}
            </div>
            <p className="mt-1 inline-flex items-center gap-1.5 font-bold">
              <Star className="h-5 w-5 fill-accent text-accent" strokeWidth={2} aria-hidden="true" />
              {texteNote(note)?.replace(' ★', '') ?? 'Nouveau'}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-muted">
              <Epingle className="h-5 w-4" />
              {[profil.district, profil.city || 'Casablanca'].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
        {profil.trades.length > 0 && (
          <ul aria-label="Mes métiers enregistrés" className="flex flex-wrap gap-2">
            {profil.trades.map((id) => {
              const metier = metiers.find((m) => m.id === id)
              if (!metier) return null
              const Icone = iconeMetier(metier.icon)
              return (
                <li key={id} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface py-1 pl-1 pr-3 font-bold">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-sand text-brand">
                    <Icone className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  {metier.label}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* US23 : photo obligatoire pour faire une offre */}
      <ChoixPhoto profil={profil} surMiseAJour={surMiseAJour} obligatoire />

      <Disponibilite profil={profil} surMiseAJour={surMiseAJour} />

      <form onSubmit={enregistrer} className="flex flex-col gap-8" noValidate>
        <div role="group" aria-labelledby="titre-metiers" className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <h2 id="titre-metiers" className="text-xl">
              Mes métiers
            </h2>
            <span
              aria-live="polite"
              className={`rounded-full px-3 py-1 font-bold tabular-nums ${
                limiteAtteinte ? 'bg-brand text-white' : 'bg-brand-light text-brand'
              }`}
            >
              {choisis.length} / {METIERS_MAX}
            </span>
          </div>
          <p className="text-muted">
            {limiteAtteinte
              ? 'Maximum atteint : retirez un métier pour en choisir un autre.'
              : 'Choisissez de 1 à 3 métiers.'}
          </p>
          <Erreur>{erreurs.metiers}</Erreur>
          {chargementMetiers && <p className="text-muted">Chargement des métiers…</p>}
          <Erreur>{erreurs.chargement}</Erreur>
          <div className="grid grid-cols-2 gap-3">
            {metiers.map((metier) => {
              const Icone = iconeMetier(metier.icon)
              const coche = choisis.includes(metier.id)
              const bloque = !coche && limiteAtteinte
              return (
                <button
                  key={metier.id}
                  type="button"
                  aria-pressed={coche}
                  disabled={bloque}
                  onClick={() => basculerMetier(metier.id)}
                  className={`relative flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 text-center transition-all active:scale-[0.97] ${
                    coche ? 'border-brand bg-brand-light' : 'border-line bg-white hover:border-brand'
                  } ${bloque ? 'opacity-40' : ''}`}
                >
                  {coche && (
                    <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-brand text-white">
                      <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                    </span>
                  )}
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-full ${
                      coche ? 'bg-brand text-white' : 'bg-sand text-brand'
                    }`}
                  >
                    <Icone className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <span className="font-bold leading-tight">{metier.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-xl">Où je travaille</h2>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-2 font-bold">
              <Epingle className="h-6 w-5" />
              Ville
            </span>
            <span className="relative">
              <select
                value={ville}
                onChange={(e) => {
                  setVille(e.target.value)
                  setArrondissement('') // la liste des arrondissements change avec la ville
                  setVoisines((v) => v.filter((nom) => nom !== e.target.value)) // US27
                  setMessage('')
                }}
                className="champ appearance-none pr-11"
              >
                {VILLES.map((nom) => (
                  <option key={nom} value={nom}>
                    {nom}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand"
                strokeWidth={3}
                aria-hidden="true"
              />
            </span>
          </label>

          {arrondissementsDe(ville).length > 0 && (
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2 font-bold">
                <Epingle className="h-6 w-5" />
                Arrondissement
              </span>
              <span className="relative">
                <select
                  value={arrondissement}
                  aria-invalid={Boolean(erreurs.arrondissement)}
                  onChange={(e) => {
                    setArrondissement(e.target.value)
                    setMessage('')
                  }}
                  className="champ appearance-none pr-11"
                >
                  <option value="">Choisir…</option>
                  {arrondissementsDe(ville).map((nom) => (
                    <option key={nom} value={nom}>
                      {nom}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand"
                  strokeWidth={3}
                  aria-hidden="true"
                />
              </span>
              <Erreur>{erreurs.arrondissement}</Erreur>
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="flex items-end justify-between gap-3">
              <span className="flex items-center gap-2 font-bold">
                <Epingle className="h-6 w-5 opacity-60" />
                Quartier <span className="font-normal text-muted">(facultatif)</span>
              </span>
              <span className="text-sm tabular-nums text-muted">
                {quartier.length} / {QUARTIER_MAX}
              </span>
            </span>
            <input
              type="text"
              maxLength={QUARTIER_MAX}
              value={quartier}
              onChange={(e) => {
                setQuartier(e.target.value)
                setMessage('')
              }}
              placeholder="Exemple : Racine"
              className="champ"
            />
            <Erreur>{erreurs.quartier}</Erreur>
          </label>

          {/* US27 : villes voisines, pour recevoir aussi leurs demandes */}
          <div role="group" aria-labelledby="titre-voisines" className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-3">
              <span id="titre-voisines" className="font-bold">
                J'accepte aussi d'aller à <span className="font-normal text-muted">(facultatif)</span>
              </span>
              <span
                aria-live="polite"
                className={`rounded-full px-3 py-1 font-bold tabular-nums ${
                  voisines.length >= VOISINES_MAX ? 'bg-brand text-white' : 'bg-brand-light text-brand'
                }`}
              >
                {voisines.length} / {VOISINES_MAX}
              </span>
            </div>
            <p className="text-muted">
              {voisines.length >= VOISINES_MAX
                ? 'Maximum atteint : retirez une ville pour en choisir une autre.'
                : `Vous verrez aussi les demandes de ces villes. ${VOISINES_MAX} villes au maximum.`}
            </p>
            <div className="flex flex-wrap gap-2">
              {VILLES.filter((nom) => nom !== ville).map((nom) => {
                const coche = voisines.includes(nom)
                const bloque = !coche && voisines.length >= VOISINES_MAX
                return (
                  <button
                    key={nom}
                    type="button"
                    aria-pressed={coche}
                    disabled={bloque}
                    onClick={() => basculerVoisine(nom)}
                    className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-3.5 font-bold transition-all active:scale-[0.97] ${
                      coche ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink hover:border-brand'
                    } ${bloque ? 'opacity-40' : ''}`}
                  >
                    {coche && <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />}
                    {nom}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Erreur>{erreurs.envoi}</Erreur>
          {message && (
            <p
              role="status"
              className="flex items-center gap-1.5 rounded-xl bg-ok-light px-3 py-2 font-bold text-ok"
            >
              <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={envoi}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-lg font-bold text-white shadow-press hover:bg-brand-dark active:scale-[0.98] disabled:opacity-60"
          >
            <Save className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
            {envoi ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </section>
  )
}
