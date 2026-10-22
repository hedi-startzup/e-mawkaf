import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeft, Banknote, Check, ChevronDown, Send, Sun, Sunrise } from 'lucide-react'
import { Epingle } from '../components/Marque'
import { Bouton, Champ, Choix, MessageErreur, Titre } from '../components/ui'
import { aujourdhuiCasablanca, demainCasablanca } from '../lib/dates'
import { chargerMetiersDemande, publierDemande } from '../lib/demandes'
import { iconeMetier } from '../lib/icones'
import { ARRONDISSEMENTS_CASABLANCA } from '../lib/quartiers'
import { useSession } from '../lib/session'
import {
  DESCRIPTION_MAX, QUARTIER_MAX, erreurArrondissement, erreurDescription, erreurMetier,
  erreurPrixFacultatif, erreurQuartier,
} from '../lib/validation'

const JOURS = [
  { valeur: 'aujourdhui', label: "Aujourd'hui", icone: Sun },
  { valeur: 'demain', label: 'Demain', icone: Sunrise },
]

function MessageChamp({ id, children }) {
  if (!children) return null
  return <p id={id} role="alert" className="font-bold text-danger">{children}</p>
}

// Publier une demande (US05) : métier, description, lieu, jour et prix facultatif (RG04).
export default function PublierDemande() {
  const { profil } = useSession()
  const navigate = useNavigate()
  const [metiers, setMetiers] = useState([])
  const [erreurMetiers, setErreurMetiers] = useState(null)
  const [form, setForm] = useState({
    metier: '', description: '', arrondissement: '', quartier: '', jour: 'aujourdhui', prix: '',
  })
  const [erreurs, setErreurs] = useState({})
  const [erreurGenerale, setErreurGenerale] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    chargerMetiersDemande().then(({ metiers: liste, erreur }) => {
      if (erreur) setErreurMetiers(erreur)
      else setMetiers(liste)
    })
  }, [])

  function changer(champ, valeur) {
    setForm((f) => ({ ...f, [champ]: valeur }))
    setErreurs((e) => ({ ...e, [champ]: null }))
  }

  async function envoyer(evenement) {
    evenement.preventDefault()
    setErreurGenerale(null)
    const e = {
      metier: erreurMetier(form.metier),
      description: erreurDescription(form.description),
      arrondissement: erreurArrondissement(form.arrondissement),
      quartier: erreurQuartier(form.quartier),
      prix: erreurPrixFacultatif(form.prix),
    }
    setErreurs(e)
    if (Object.values(e).some(Boolean)) return

    setEnvoi(true)
    const { erreur } = await publierDemande({
      ...form,
      idClient: profil.id,
      jour: form.jour === 'demain' ? demainCasablanca() : aujourdhuiCasablanca(),
    })
    setEnvoi(false)
    if (erreur) return setErreurGenerale(erreur)
    navigate('/client', { state: { demandePubliee: true } })
  }

  const longueur = form.description.trim().length
  const devis = !form.prix.trim()

  return (
    <section className="flex flex-col gap-6">
      <Link to="/client" className="inline-flex min-h-12 items-center gap-2 self-start font-bold text-brand">
        <ArrowLeft className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        Mes demandes
      </Link>
      <Titre>Publier une demande</Titre>

      <form onSubmit={envoyer} noValidate className="flex flex-col gap-8">
        <div role="group" aria-labelledby="titre-metier" className="flex flex-col gap-3">
          <h2 id="titre-metier" className="text-xl">De quoi avez-vous besoin ?</h2>
          <MessageChamp>{erreurs.metier}</MessageChamp>
          <MessageChamp>{erreurMetiers}</MessageChamp>
          {!metiers.length && !erreurMetiers && <p className="text-muted">Chargement des métiers…</p>}
          <div className="grid grid-cols-2 gap-3">
            {metiers.map((metier) => {
              const Icone = iconeMetier(metier.icon)
              const choisi = form.metier === metier.id
              return (
                <button
                  key={metier.id}
                  type="button"
                  aria-pressed={choisi}
                  onClick={() => changer('metier', metier.id)}
                  className={`relative flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 text-center transition-all active:scale-[0.97] ${
                    choisi ? 'border-brand bg-brand-light' : 'border-line bg-white hover:border-brand'
                  }`}
                >
                  {choisi && (
                    <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-brand text-white">
                      <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                    </span>
                  )}
                  <span className={`grid h-12 w-12 place-items-center rounded-full ${choisi ? 'bg-brand text-white' : 'bg-sand text-brand'}`}>
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
            <input type="text" value="Casablanca" readOnly className="champ bg-gray-light text-muted" />
          </label>
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
                {ARRONDISSEMENTS_CASABLANCA.map((nom) => <option key={nom} value={nom}>{nom}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand" strokeWidth={3} aria-hidden="true" />
            </span>
            <MessageChamp>{erreurs.arrondissement}</MessageChamp>
          </label>
          <Champ id="quartier" label="Quartier (facultatif)" maxLength={QUARTIER_MAX} placeholder="Exemple : Racine"
            value={form.quartier} onChange={(e) => changer('quartier', e.target.value)} erreur={erreurs.quartier} />
        </div>

        <Choix legende="Pour quand ?" options={JOURS} valeur={form.jour} onChange={(v) => changer('jour', v)} />

        <Champ id="prix" label="Prix proposé en DH (facultatif)" icone={Banknote} inputMode="numeric"
          placeholder="Exemple : 150" value={form.prix}
          aide={devis ? 'Laissez vide pour demander un devis : les artisans proposeront leur prix.' : 'Entre 50 et 5 000 DH.'}
          onChange={(e) => changer('prix', e.target.value.replace(/\s/g, ''))} erreur={erreurs.prix} />

        <MessageErreur>{erreurGenerale}</MessageErreur>

        <Bouton type="submit" disabled={envoi} className="inline-flex items-center justify-center gap-2">
          <Send className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
          {envoi ? 'Publication…' : devis ? 'Demander des devis' : 'Publier ma demande'}
        </Bouton>
      </form>
    </section>
  )
}
