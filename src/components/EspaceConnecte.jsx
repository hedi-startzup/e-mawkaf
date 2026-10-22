import { Link, NavLink, Outlet } from 'react-router'
import { HandCoins, House, Inbox, LogOut, Plus, Settings, UserRound } from 'lucide-react'
import { deconnecter } from '../lib/auth'
import { useSession } from '../lib/session'
import { Logo } from './Marque'

// Navigation par rôle. Les entrées « mobile: false » n'apparaissent pas dans la barre du bas
// (4 entrées au plus sur 375 px) : on y accède par la pastille de l'en-tête.
const NAVIGATION = {
  client: [
    ['/client', 'Tableau de bord', House],
    ['/client/publier', 'Créer une demande', Plus],
    ['/client/parametres', 'Paramètres', Settings, { mobile: false }],
  ],
  artisan: [
    ['/artisan', 'Mon fil', Inbox],
    ['/artisan/offres', 'Mes offres', HandCoins],
    ['/artisan/profil', 'Mon profil', UserRound],
    ['/artisan/parametres', 'Paramètres', Settings, { mobile: false }],
  ],
}

// Cadre des pages connectées, mis en page comme la maquette : en-tête blanc,
// barre latérale sur ordinateur (md et plus), barre de navigation en bas sur téléphone.
export default function EspaceConnecte({ artisan = false }) {
  const { profil } = useSession()
  const role = artisan ? 'artisan' : 'client'
  const liens = NAVIGATION[role]
  const liensMobile = liens.filter(([, , , options]) => options?.mobile !== false)
  const initiale = (profil?.full_name ?? '').trim().charAt(0).toUpperCase()

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="flex h-16 w-full items-center justify-between gap-3 px-4 md:px-6">
          <Logo />
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={`/${role}/parametres`}
              title="Paramètres du compte"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-line pl-1.5 pr-4 font-bold text-ink hover:border-brand"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-sand font-display text-brand" aria-hidden="true">
                {initiale || <UserRound className="h-4 w-4" strokeWidth={2.5} />}
              </span>
              {artisan ? 'Artisan' : 'Client'}
            </Link>
            {/* Sur ordinateur, la déconnexion est dans la barre latérale */}
            <button
              type="button"
              onClick={deconnecter}
              aria-label="Se déconnecter"
              title="Se déconnecter"
              className="grid h-12 w-12 place-items-center rounded-full text-brand hover:bg-brand-light md:hidden"
            >
              <LogOut className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full flex-1">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col justify-between border-r border-line bg-white p-4 md:flex">
          <nav aria-label="Navigation" className="flex flex-col gap-1">
            {liens.map(([chemin, libelle, Icone]) => (
              <NavLink
                key={chemin}
                to={chemin}
                end
                className={({ isActive }) =>
                  `inline-flex h-12 items-center gap-3 rounded-xl px-4 font-bold ${
                    isActive ? 'bg-brand-light text-brand' : 'text-muted hover:bg-gray-light hover:text-ink'
                  }`
                }
              >
                <Icone className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                {libelle}
              </NavLink>
            ))}
          </nav>
          {/* Après la déconnexion, PageProtegee renvoie vers l'écran de connexion */}
          <button
            type="button"
            onClick={deconnecter}
            className="inline-flex h-12 items-center gap-3 rounded-xl px-4 font-bold text-muted hover:bg-gray-light hover:text-ink"
          >
            <LogOut className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
            Déconnexion
          </button>
        </aside>

        {/* Les formulaires et pages de détail limitent eux-mêmes leur largeur */}
        <main className="mx-auto w-full max-w-md min-w-0 flex-1 px-4 pt-5 pb-28 md:max-w-5xl md:px-8 md:pt-8 md:pb-10">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white shadow-float md:hidden"
      >
        <div className="mx-auto grid w-full max-w-md" style={{ gridTemplateColumns: `repeat(${liensMobile.length}, minmax(0, 1fr))` }}>
          {liensMobile.map(([chemin, libelle, Icone]) => (
            <NavLink
              key={chemin}
              to={chemin}
              end
              className={({ isActive }) =>
                `relative flex h-[72px] flex-col items-center justify-center gap-1 text-sm font-bold ${isActive ? 'text-brand' : 'text-muted'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute inset-x-6 top-0 h-1 rounded-b-full bg-accent" aria-hidden="true" />}
                  <span className={`grid h-9 w-14 place-items-center rounded-full ${isActive ? 'bg-brand-light' : ''}`}>
                    <Icone className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  {libelle}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
