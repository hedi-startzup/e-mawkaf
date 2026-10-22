// Illustrations dessinées pour Mawkaf (aucune image externe, donc aucune licence à vérifier).
// Couleurs du logo uniquement, via les jetons Tailwind (fill-brand, stroke-brand...).

// Arcade : rectangle surmonté d'un arc, comme les portes de la mosquée
function Arcade({ x, y, largeur, hauteur, className = 'fill-sand' }) {
  const r = largeur / 2
  return (
    <path
      className={`${className} stroke-brand`}
      strokeWidth="1.2"
      d={`M${x} ${y + hauteur}V${y + r}A${r} ${r} 0 0 1 ${x + largeur} ${y + r}V${y + hauteur}Z`}
    />
  )
}

// Silhouette de la mosquée Hassan II à Casablanca, au trait, devant des nuages.
export function MosqueeHassanII({ className = '' }) {
  const petitesArcades = Array.from({ length: 26 }, (_, i) => 54 + i * 11)
  const fenetres = [92, 112, 132, 152, 172, 192, 212]
  return (
    <svg viewBox="0 0 400 280" className={className} aria-hidden="true">
      {/* Nuages */}
      <g className="fill-brand-light">
        <circle cx="40" cy="200" r="46" />
        <circle cx="105" cy="182" r="52" />
        <circle cx="175" cy="196" r="44" />
        <circle cx="300" cy="186" r="50" />
        <circle cx="365" cy="200" r="44" />
        <rect x="0" y="196" width="400" height="58" />
      </g>
      <g className="fill-sand" opacity="0.7">
        <circle cx="70" cy="226" r="30" />
        <circle cx="335" cy="222" r="34" />
      </g>

      {/* Salle de prière : toits */}
      <path className="fill-brand" d="M86 170L100 158H246V170Z" />
      <path className="fill-brand-dark" d="M120 158L130 150H246V158Z" />
      {/* Salle de prière : façade et créneaux */}
      <rect x="78" y="170" width="170" height="12" className="fill-white stroke-brand" strokeWidth="1.2" />
      {fenetres.map((x) => (
        <rect key={x} x={x} y="173" width="3" height="6" rx="1.5" className="fill-brand" />
      ))}
      <rect x="70" y="182" width="178" height="42" className="fill-white stroke-brand" strokeWidth="1.2" />
      <Arcade x={80} y={190} largeur={20} hauteur={34} />
      <Arcade x={136} y={190} largeur={20} hauteur={34} />
      <Arcade x={164} y={190} largeur={20} hauteur={34} />
      <Arcade x={192} y={190} largeur={20} hauteur={34} />
      <Arcade x={220} y={190} largeur={20} hauteur={34} />
      {/* Grande porte */}
      <rect x="104" y="184" width="28" height="40" className="fill-white stroke-brand" strokeWidth="1.2" />
      <Arcade x={108} y={190} largeur={20} hauteur={34} className="fill-white" />
      <Arcade x={113} y={198} largeur={10} hauteur={26} className="fill-accent" />

      {/* Minaret */}
      <rect x="248" y="58" width="36" height="166" className="fill-white stroke-brand" strokeWidth="1.2" />
      <rect x="248" y="70" width="36" height="16" className="fill-brand" />
      {[254, 262, 270, 278].map((x) => (
        <rect key={x} x={x - 1} y="92" width="2" height="6" className="fill-brand" />
      ))}
      <path className="fill-accent" d="M252 104h10l-10 10Z M280 104h-10l10 10Z" />
      <Arcade x={258} y={118} largeur={16} hauteur={18} className="fill-sand" />
      {/* Motif de zellige le long du minaret */}
      {[146, 162, 178, 194, 210].map((y) => (
        <g key={y} transform={`translate(266 ${y})`}>
          <path d="M0 -5L5 0L0 5L-5 0Z" className="fill-accent" />
          <circle r="1.4" className="fill-white" />
        </g>
      ))}
      <path className="stroke-brand" strokeWidth="1" strokeDasharray="1.5 3" d="M254 140V218 M278 140V218" />
      {/* Créneaux et lanterne */}
      <path className="fill-brand" d="M248 58V52l4 4 4-4 4 4 4-4 4 4 4-4 4 4 4-4 4 4V58Z" />
      <rect x="258" y="34" width="16" height="18" className="fill-white stroke-brand" strokeWidth="1.2" />
      <rect x="262" y="38" width="8" height="8" className="fill-brand-light" />
      <path className="fill-brand" d="M256 34a10 7 0 0 1 20 0Z" />
      <circle cx="266" cy="23" r="2.6" className="fill-accent" />
      <circle cx="266" cy="17" r="1.6" className="fill-accent" />
      <circle cx="266" cy="12.5" r="1" className="fill-accent" />

      {/* Aile droite */}
      <rect x="284" y="196" width="40" height="28" className="fill-white stroke-brand" strokeWidth="1.2" />
      <Arcade x={292} y={202} largeur={18} hauteur={22} />

      {/* Esplanade avec petites arcades, et ligne d'horizon */}
      <rect x="44" y="224" width="300" height="16" className="fill-white stroke-brand" strokeWidth="1.2" />
      {petitesArcades.map((x) => (
        <path key={x} className="fill-brand-light stroke-brand" strokeWidth="0.8" d={`M${x} 238V231a3 3 0 0 1 6 0V238Z`} />
      ))}
      <path className="stroke-brand" strokeWidth="1.2" d="M0 240H36 M44 240H344 M352 240H400" />
    </svg>
  )
}
