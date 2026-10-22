import { createElement, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronDown, Clock, MapPin, Search, ShieldCheck, Star } from 'lucide-react'
import { Etoile, Filigrane, Logo } from '../components/Marque'
import { chargerMetiersDemande } from '../lib/demandes'
import { iconeMetier } from '../lib/icones'

// Avantages : seulement des promesses vraies (pas d'« artisans vérifiés » : aucune vérification n'existe).
const AVANTAGES = [
  [Star, 'Artisans notés par les clients'],
  [MapPin, 'Demandes près de chez vous'],
  [Clock, 'Réponses rapides'],
  [ShieldCheck, 'Numéro protégé jusqu’au choix'],
]

// Page d'accueil publique (maquette n°1). Une personne connectée est envoyée vers son espace (PageVisiteur).
export default function Bienvenue() {
  const navigate = useNavigate()
  const [metiers, setMetiers] = useState([])
  const [metier, setMetier] = useState('')

  useEffect(() => {
    // Si la liste ne se charge pas, la recherche reste utilisable : elle mène à l'inscription.
    chargerMetiersDemande().then(({ metiers: liste }) => setMetiers(liste ?? []))
  }, [])

  const iconeChoisie = metier ? iconeMetier(metiers.find((m) => m.id === metier)?.icon) : Search

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4 md:px-8">
          <Logo />
          <nav aria-label="Compte" className="flex shrink-0 items-center gap-2">
            <Link to="/connexion" className="inline-flex h-11 items-center rounded-xl px-3 font-bold text-brand hover:bg-brand-light">
              Se connecter
            </Link>
            <Link
              to="/inscription"
              className="hidden h-11 items-center rounded-xl bg-brand px-4 font-bold text-white shadow-press hover:bg-brand-dark sm:inline-flex"
            >
              Créer un compte
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-8 md:px-8 md:py-14">
        <section className="grid items-center gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-[32px] leading-tight md:text-[44px]">Trouvez un artisan près de chez vous</h1>
              <p className="mt-3 text-lg text-muted">Rapide · Fiable · Local</p>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); navigate('/inscription') }}
              className="flex flex-col gap-3 rounded-card border border-line bg-white p-2 shadow-card sm:flex-row"
            >
              <label htmlFor="service" className="sr-only">Quel service recherchez-vous ?</label>
              <span className="relative flex-1">
                {createElement(iconeChoisie, {
                  className: 'pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand',
                  strokeWidth: 2.5,
                  'aria-hidden': true,
                })}
                <select
                  id="service"
                  value={metier}
                  onChange={(e) => setMetier(e.target.value)}
                  className="champ appearance-none border-0 pl-11 pr-10 focus:shadow-none"
                >
                  <option value="">Quel service recherchez-vous ?</option>
                  {metiers.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" strokeWidth={2.5} aria-hidden="true" />
              </span>
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 font-bold text-white shadow-press hover:bg-brand-dark active:scale-[0.98]"
              >
                <Search className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                Trouver un artisan
              </button>
            </form>

            <p className="text-muted">
              Vous êtes artisan ?{' '}
              <Link to="/inscription" className="font-bold text-brand underline">Recevez des demandes à Casablanca</Link>
            </p>
          </div>

          {/* Illustration : le logo sur un panneau sable avec des étoiles (aucune image externe) */}
          <div className="relative hidden aspect-square w-full max-w-md justify-self-center overflow-hidden rounded-[2rem] bg-sand md:grid md:place-items-center">
            <Filigrane className="-left-10 -top-10 h-40 w-40" />
            <Filigrane className="-bottom-14 -right-12 h-52 w-52 opacity-50" />
            <Etoile className="absolute right-10 top-10 h-10 w-10 text-accent" trou={false} />
            <Etoile className="absolute bottom-12 left-12 h-7 w-7 text-brand" trou={false} />
            <div className="relative"><Logo grand /></div>
          </div>
        </section>

        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {AVANTAGES.map(([IconeAvantage, texte]) => (
            <li key={texte} className="flex flex-col items-center gap-3 rounded-card border border-line bg-white p-4 text-center shadow-card">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-light text-brand">
                <IconeAvantage className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
              </span>
              <span className="font-bold leading-tight">{texte}</span>
            </li>
          ))}
        </ul>

        {metiers.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-xl">Les métiers sur Mawkaf</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {metiers.map((m) => {
                const IconeMetier = iconeMetier(m.icon)
                return (
                  <li key={m.id}>
                    <Link
                      to="/inscription"
                      className="flex min-h-14 items-center gap-3 rounded-xl border border-line bg-white p-3 font-bold hover:border-brand"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sand text-brand">
                        <IconeMetier className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 leading-tight">{m.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}
