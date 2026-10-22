import { createElement, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRightLeft, ChevronDown, Search, ShieldCheck, ShieldHalf, UserSearch } from 'lucide-react'
import { Logo, Zellige } from '../components/Marque'
import { chargerMetiersDemande } from '../lib/demandes'
import { iconeMetier } from '../lib/icones'

// Avantages de la maquette n°1 (libellés validés par l'équipe, à confirmer par Hedi)
const AVANTAGES = [
  [ShieldCheck, 'Artisans vérifiés'],
  [UserSearch, 'Demandes locales'],
  [ArrowRightLeft, 'Mise en relation rapide'],
  [ShieldHalf, 'Sécurisé'],
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

  const iconeChoisie = metier ? iconeMetier(metiers.find((m) => m.id === metier)?.icon) : null

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-white">
      <Zellige className="absolute -right-1 -top-1 h-14 w-14 md:h-44 md:w-44" />

      <header className="relative">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 md:h-20 md:px-8">
          <Logo />
          <nav aria-label="Compte" className="mr-10 flex shrink-0 items-center gap-1 md:mr-36">
            <Link to="/connexion" className="inline-flex h-11 items-center rounded-xl px-3 font-bold text-brand hover:bg-brand-light">
              Se connecter
            </Link>
            <Link to="/inscription" className="hidden h-11 items-center rounded-xl px-3 font-bold text-brand hover:bg-brand-light sm:inline-flex">
              Créer un compte
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-4 pb-12 pt-6 md:px-8 md:pt-12">
        <section className="grid items-center gap-8 md:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-[34px] leading-[1.15] md:text-[52px]">
                Trouvez un artisan
                <span className="block text-accent">près de chez vous</span>
              </h1>
              <p className="mt-3 text-lg text-ink md:text-xl">Rapide · Fiable · Local</p>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); navigate('/inscription') }}
              className="flex max-w-lg overflow-hidden rounded-xl border border-line bg-white shadow-card"
            >
              <label htmlFor="service" className="sr-only">Quel service recherchez-vous ?</label>
              <span className="relative min-w-0 flex-1">
                {iconeChoisie && createElement(iconeChoisie, {
                  className: 'pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand',
                  strokeWidth: 2.5,
                  'aria-hidden': true,
                })}
                <select
                  id="service"
                  value={metier}
                  onChange={(e) => setMetier(e.target.value)}
                  className={`h-14 w-full appearance-none bg-transparent pr-10 text-base text-ink md:text-lg focus:outline-none ${iconeChoisie ? 'pl-11' : 'pl-4'} ${metier ? '' : 'text-muted'}`}
                >
                  <option value="">Quel service recherchez-vous ?</option>
                  {metiers.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" strokeWidth={2.5} aria-hidden="true" />
              </span>
              <button
                type="submit"
                aria-label="Rechercher un artisan"
                className="grid w-14 shrink-0 place-items-center bg-accent text-white hover:brightness-95"
              >
                <Search className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
              </button>
            </form>

            <p className="text-muted">
              Vous êtes artisan ?{' '}
              <Link to="/inscription" className="font-bold text-brand underline">Recevez des demandes à Casablanca</Link>
            </p>
          </div>

          {/* Illustration fournie par l'équipe (extraite de la maquette, fond rendu transparent) */}
          <img
            src="/illustrations/artisan-accueil.png"
            alt=""
            width={555}
            height={504}
            className="mx-auto w-full max-w-xs md:max-w-md"
          />
        </section>

        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {AVANTAGES.map(([IconeAvantage, texte]) => (
            <li key={texte} className="flex flex-col items-center gap-3 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-accent-light text-accent">
                <IconeAvantage className="h-7 w-7" strokeWidth={2.25} aria-hidden="true" />
              </span>
              <span className="font-bold leading-tight text-ink">{texte}</span>
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
                      className="flex min-h-14 items-center gap-3 rounded-xl border border-line bg-white p-3 font-bold hover:border-accent"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-light text-accent">
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
