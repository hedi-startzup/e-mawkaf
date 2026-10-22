// Éléments d'identité visuelle : logo, étoile marocaine décorative, épingle de lieu.
import { Link } from 'react-router'

// Logo : le symbole (sans texte) + le mot « Mawkaf » ajouté à côté (Règles visuelles).
export function Logo({ grand = false }) {
  if (grand) {
    return (
      <div className="flex flex-col items-center gap-3">
        <img src="/mawkaf-symbole.png" alt="" width={160} height={160} className="h-40 w-40" />
        <span className="font-display text-4xl font-bold leading-none text-brand">Mawkaf</span>
      </div>
    )
  }
  return (
    <div className="flex min-w-0 items-center gap-2">
      <img src="/mawkaf-symbole.png" alt="" width={32} height={32} className="h-8 w-8 shrink-0" />
      <span className="font-display truncate text-[22px] font-bold leading-none text-brand">
        Mawkaf
      </span>
    </div>
  )
}

// Étoile à 8 branches (khatam) : un carré et le même carré tourné de 45°, percés d'un rond.
export function Etoile({ className = '', trou = true }) {
  return (
    <svg viewBox="-50 -50 100 100" className={className} aria-hidden="true" fill="currentColor">
      <path
        fillRule="evenodd"
        d={
          'M-35 -35H35V35H-35Z M0 -49.5L49.5 0L0 49.5L-49.5 0Z' +
          (trou ? ' M0 -16a16 16 0 1 0 0.01 0Z' : '')
        }
      />
    </svg>
  )
}

// Grande étoile sable en fond de page, jamais derrière du texte.
export function Filigrane({ className = '' }) {
  return (
    <Etoile
      className={`pointer-events-none absolute select-none text-sand-deep opacity-70 ${className}`}
    />
  )
}

// Épingle de lieu bleue avec l'étoile, pour l'arrondissement et le quartier.
export function Epingle({ className = '' }) {
  return (
    <svg viewBox="0 0 24 28" className={`shrink-0 ${className}`} aria-hidden="true">
      <path
        d="M12 1C6 1 1.5 5.5 1.5 11.2c0 6.8 7.6 13.2 9.6 15.1a1.3 1.3 0 0 0 1.8 0c2-1.9 9.6-8.3 9.6-15.1C22.5 5.5 18 1 12 1Z"
        className="fill-brand"
      />
      <g transform="translate(12 11) scale(0.13)">
        <path d="M-35 -35H35V35H-35Z M0 -49.5L49.5 0L0 49.5L-49.5 0Z" className="fill-sand" />
        <circle r="16" className="fill-accent" />
      </g>
    </svg>
  )
}

// Cadre des pages visiteur (connexion, inscription), comme la maquette : sur ordinateur, une carte
// en deux colonnes avec le formulaire à gauche et un panneau sable avec le logo à droite.
export function CadreVisiteur({ children }) {
  return (
    <main className="min-h-screen w-full px-4 py-8 md:grid md:place-items-center md:py-12">
      <div className="mx-auto w-full max-w-md md:grid md:max-w-4xl md:grid-cols-2 md:overflow-hidden md:rounded-card md:border md:border-line md:bg-white md:shadow-card">
        <div className="flex flex-col gap-6 md:p-10">
          <Link to="/" aria-label="Accueil Mawkaf" className="self-start"><Logo /></Link>
          {children}
        </div>
        <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-sand p-10 text-center md:flex">
          <Filigrane className="-left-12 -top-12 h-40 w-40" />
          <Filigrane className="-bottom-16 -right-14 h-48 w-48 opacity-50" />
          <div className="relative">
            <Logo grand />
            <p className="mt-6 font-display text-xl font-bold text-ink">
              Des artisans de confiance à Casablanca
            </p>
            <p className="mt-2 text-muted">Artisans à la journée · Prix en DH</p>
          </div>
        </div>
      </div>
    </main>
  )
}
