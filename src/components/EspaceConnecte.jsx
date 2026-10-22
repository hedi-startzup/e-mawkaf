import { NavLink, Outlet } from 'react-router'
import { HandCoins, Inbox, LogOut, UserRound } from 'lucide-react'
import { deconnecter } from '../lib/auth'
import { Filigrane, Logo } from './Marque'

const NAVIGATION_ARTISAN = [
  ['/artisan', 'Mon fil', Inbox],
  ['/artisan/offres', 'Mes offres', HandCoins],
  ['/artisan/profil', 'Mon profil', UserRound],
]

// Cadre des pages connectées : en-tête avec logo et déconnexion,
// et navigation de l'artisan : en bas sur téléphone, dans l'en-tête sur ordinateur (md et plus).
export default function EspaceConnecte({ artisan = false }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-30 overflow-hidden border-b border-sand-deep bg-sand">
        <Filigrane className="-right-6 -top-10 h-28 w-28" />
        <div className="relative mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4 md:h-20 md:px-8">
          <Logo />
          {artisan && (
            <nav aria-label="Navigation" className="hidden flex-1 justify-center gap-2 md:flex">
              {NAVIGATION_ARTISAN.map(([chemin, libelle, Icone]) => (
                <NavLink
                  key={chemin}
                  to={chemin}
                  end
                  className={({ isActive }) =>
                    `inline-flex h-12 items-center gap-2 rounded-full px-5 font-bold ${
                      isActive ? 'bg-white text-brand shadow-card' : 'text-muted hover:bg-white/60'
                    }`
                  }
                >
                  <Icone className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                  {libelle}
                </NavLink>
              ))}
            </nav>
          )}
          {/* Après la déconnexion, PageProtegee renvoie vers l'écran de connexion */}
          <button
            type="button"
            onClick={deconnecter}
            aria-label="Se déconnecter"
            title="Se déconnecter"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-brand shadow-card hover:bg-brand-light"
          >
            <LogOut className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Sur ordinateur, l'espace artisan est plus large pour afficher les listes en 2 colonnes */}
      <main className={`mx-auto w-full max-w-md flex-1 px-4 pt-5 md:px-8 md:pt-10 ${artisan ? 'pb-28 md:max-w-5xl md:pb-10' : 'pb-10 md:max-w-2xl'}`}>
        <Outlet />
      </main>

      {artisan && (
        <nav
          aria-label="Navigation"
          className="fixed inset-x-0 bottom-0 z-30 mx-auto grid w-full max-w-md grid-cols-3 border-t border-line bg-white shadow-float md:hidden"
        >
          {NAVIGATION_ARTISAN.map(([chemin, libelle, Icone]) => (
            <NavLink
              key={chemin}
              to={chemin}
              end
              className={({ isActive }) =>
                `flex h-[72px] flex-col items-center justify-center gap-1 font-bold ${isActive ? 'text-brand' : 'text-muted'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`grid h-9 w-14 place-items-center rounded-full ${isActive ? 'bg-sand' : ''}`}>
                    <Icone className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  {libelle}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
