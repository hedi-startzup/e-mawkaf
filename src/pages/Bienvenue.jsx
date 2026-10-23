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
      <Zellige className="absolute right-0 top-0 h-16 w-16 md:h-40 md:w-40" />

      <header className="relative border-b border-line/70">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 md:h-20 md:px-8">
          <Logo />
          <nav aria-label="Compte" className="mr-12 flex shrink-0 items-center gap-1 md:mr-32">
            <Link to="/connexion" className="inline-flex h-11 items-center rounded-xl px-3 font-bold text-brand hover:bg-brand-light">
              Se connecter
            </Link>
            <Link to="/inscription" className="hidden h-11 items-center rounded-xl bg-brand px-4 font-bold text-white shadow-press hover:bg-brand-dark sm:inline-flex">
              Créer un compte
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pb-12 pt-6 md:gap-6 md:px-8 md:pt-6">
        <section className="grid items-center gap-6 md:grid-cols-[1.15fr_1fr] md:gap-10">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-[34px] leading-[1.12] tracking-tight md:text-[50px]">
                Trouvez un artisan
                <span className="block text-accent">près de chez vous</span>
              </h1>
              <p className="mt-3 text-lg text-ink md:text-xl">Rapide · Fiable · Local</p>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); navigate('/inscription') }}
              className="flex max-w-lg overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-[0_10px_30px_-12px_rgb(23_47_126/0.25)] focus-within:border-brand"
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
                  className={`h-13 w-full appearance-none bg-transparent pr-10 text-base text-ink md:text-lg focus:outline-none ${iconeChoisie ? 'pl-11' : 'pl-4'} ${metier ? '' : 'text-muted'}`}
                >
                  <option value="">Quel service recherchez-vous ?</option>
                  {metiers.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" strokeWidth={2.5} aria-hidden="true" />
              </span>
              <button
                type="submit"
                aria-label="Rechercher un artisan"
                className="grid h-13 w-13 shrink-0 place-items-center rounded-xl bg-accent text-white hover:brightness-95"
              >
                <Search className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
              </button>
            </form>

            <p className="text-muted">
              Vous êtes artisan ?{' '}
              <Link to="/inscription" className="font-bold text-brand underline">Recevez des demandes près de chez vous</Link>
            </p>
          </div>

          <img
            src="/illustrations/artisans-riad.jpg"
            alt="Artisans au travail dans une maison marocaine : électricien, peintre, menuisier et carreleur"
            className="mx-auto h-auto w-full max-w-[17rem] rounded-card shadow-card md:max-w-[21rem]"
          />
        </section>

        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 rounded-card border border-line bg-white px-4 py-6 shadow-card md:grid-cols-4 md:py-5">
          {AVANTAGES.map(([IconeAvantage, texte]) => (
            <li key={texte} className="flex flex-col items-center gap-3 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-accent-light text-accent">
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
                    {/* Sur téléphone, picto au-dessus du nom : les noms longs (« Électroménager »,
                        « Déménagement et manutention ») ne débordent plus de la case, même en grande police */}
                    <Link
                      to="/inscription"
                      className="flex h-full min-h-14 flex-col items-center justify-center gap-2 rounded-xl border border-line bg-white p-3 text-center font-bold hover:border-accent sm:flex-row sm:justify-start sm:gap-3 sm:text-left"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-light text-accent">
                        <IconeMetier className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                      </span>
                      <span className="w-full min-w-0 leading-tight hyphens-auto [overflow-wrap:anywhere] sm:w-auto">{m.label}</span>
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
