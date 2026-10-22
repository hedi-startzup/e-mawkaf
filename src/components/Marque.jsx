// Éléments d'identité visuelle : logo, étoile marocaine décorative, épingle de lieu.
import { Link } from 'react-router'
import { MosqueeHassanII } from './Illustrations'

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
// en deux colonnes avec le formulaire à gauche et, à droite, le logo, l'accroche et la mosquée Hassan II.
export function CadreVisiteur({ children }) {
  return (
    <main className="min-h-screen w-full px-4 py-8 md:grid md:place-items-center md:py-12">
      <div className="mx-auto w-full max-w-md md:grid md:max-w-4xl md:grid-cols-2 md:overflow-hidden md:rounded-card md:border md:border-line md:bg-white md:shadow-card">
        <div className="flex flex-col gap-6 md:p-10">
          <Link to="/" aria-label="Accueil Mawkaf" className="self-start"><Logo /></Link>
          {children}
          <MosqueeHassanII className="-mx-4 mt-2 w-[calc(100%+2rem)] max-w-none md:hidden" />
        </div>
        <div className="relative hidden flex-col overflow-hidden bg-creme md:flex">
          <Zellige className="absolute -right-1 -top-1 h-24 w-24" />
          <div className="relative flex flex-1 flex-col items-center justify-center px-10 pt-20 text-center">
            <Logo />
            <p className="mt-4 max-w-xs font-display text-lg font-bold leading-snug text-ink">
              Des artisans de confiance à Casablanca
            </p>
            <p className="mt-2 text-muted">Artisans à la journée · Prix en DH</p>
          </div>
          <MosqueeHassanII className="relative w-full" />
        </div>
      </div>
    </main>
  )
}

// Coin décoratif en zellige (maquette) : mosaïque de carreaux jointifs en escalier, aux couleurs
// du logo, dessinée en SVG pour rester nette. Toujours décorative, jamais derrière du texte.
// Chaque carreau : un fond, une étoile à 8 branches d'une autre couleur et un cœur blanc.
const CARREAUX_ZELLIGE = [
  ['fill-brand', 'fill-sand'],
  ['fill-accent', 'fill-creme'],
  ['fill-sand-deep', 'fill-brand'],
  ['fill-brand-light', 'fill-accent'],
  ['fill-brand-dark', 'fill-accent'],
  ['fill-sand', 'fill-brand'],
]
const COTE = 6 // carreaux par côté du coin

export function Zellige({ className = '' }) {
  const carreaux = []
  for (let ligne = 0; ligne < COTE; ligne++) {
    for (let colonne = ligne; colonne < COTE; colonne++) {
      // Escalier vers le coin haut droit ; les carreaux du bord s'estompent
      const bord = COTE - 1 - colonne // 0 = carreau du bord en escalier
      const [fond, etoile] = CARREAUX_ZELLIGE[(ligne * 3 + colonne * 2) % CARREAUX_ZELLIGE.length]
      carreaux.push(
        <g
          key={`${ligne}-${colonne}`}
          transform={`translate(${(COTE - 1 - colonne + ligne) * 20 + 10} ${ligne * 20 + 10})`}
          opacity={bord === 0 ? 0.45 : bord === 1 ? 0.75 : 1}
        >
          <rect x="-9.5" y="-9.5" width="19" height="19" rx="1.5" className={fond} />
          <path transform="scale(0.15)" d="M-35 -35H35V35H-35Z M0 -49.5L49.5 0L0 49.5L-49.5 0Z" className={etoile} />
          <circle r="2.2" className="fill-white" />
        </g>,
      )
    }
  }
  return (
    <svg viewBox={`0 0 ${COTE * 20} ${COTE * 20}`} className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      {carreaux}
    </svg>
  )
}
