import { NavLink, Outlet } from 'react-router'
import { Inbox, LogOut, UserRound } from 'lucide-react'
import { deconnecter } from '../lib/auth'
import { Filigrane, Logo } from './Marque'

const NAVIGATION_ARTISAN = [
  ['/artisan', 'Mon fil', Inbox],
  ['/artisan/profil', 'Mon profil', UserRound],
]

// Cadre des pages connectées : en-tête avec logo et déconnexion,
// et barre de navigation en bas pour l'artisan.
export default function EspaceConnecte({ artisan = false }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <header className="sticky top-0 z-30 overflow-hidden border-b border-sand-deep bg-sand">
        <Filigrane className="-right-6 -top-10 h-28 w-28" />
        <div className="relative flex h-16 items-center justify-between gap-3 px-4">
          <Logo />
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

      <main className={`flex-1 px-4 pt-5 ${artisan ? 'pb-28' : 'pb-10'}`}>
        <Outlet />
      </main>

      {artisan && (
        <nav
          aria-label="Navigation"
          className="fixed inset-x-0 bottom-0 z-30 mx-auto grid w-full max-w-md grid-cols-2 border-t border-line bg-white shadow-float"
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
