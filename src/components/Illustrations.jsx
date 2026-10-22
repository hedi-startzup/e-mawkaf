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

// Artisan souriant, clé à molette levée, devant une maison (page d'accueil, maquette n°1).
export function ArtisanMaison({ className = '' }) {
  return (
    <svg viewBox="0 0 480 420" className={className} aria-hidden="true">
      {/* Fond : disques crème et terracotta pâle, sol sable */}
      <circle cx="250" cy="225" r="190" className="fill-creme" />
      <circle cx="250" cy="225" r="145" className="fill-accent-light" opacity="0.7" />
      <ellipse cx="255" cy="382" rx="215" ry="16" className="fill-sand" />

      {/* Petites étincelles décoratives */}
      <path className="stroke-accent" strokeWidth="5" strokeLinecap="round" d="M78 150v24M66 162h24" />
      <path className="stroke-brand" strokeWidth="4" strokeLinecap="round" d="M440 96v18M431 105h18" />
      <circle cx="110" cy="96" r="5" className="fill-sand-deep" />
      <circle cx="420" cy="170" r="4" className="fill-accent" />

      {/* Maison */}
      <rect x="296" y="218" width="118" height="162" rx="4" className="fill-white stroke-brand" strokeWidth="3" />
      <rect x="388" y="160" width="15" height="40" className="fill-brand-dark" />
      <path d="M280 226L355 150L430 226Z" className="fill-brand" strokeLinejoin="round" />
      <circle cx="355" cy="196" r="11" className="fill-sand stroke-brand" strokeWidth="3" />
      {[[310, 240], [374, 240]].map(([x, y]) => (
        <g key={x}>
          <rect x={x} y={y} width="28" height="30" rx="3" className="fill-sand stroke-brand" strokeWidth="3" />
          <path d={`M${x + 14} ${y}v30M${x} ${y + 15}h28`} className="stroke-brand" strokeWidth="2.5" />
        </g>
      ))}
      <rect x="340" y="308" width="32" height="72" rx="16" className="fill-accent" />
      <rect x="340" y="344" width="32" height="36" className="fill-accent" />
      <circle cx="364" cy="346" r="3" className="fill-white" />
      <rect x="306" y="300" width="22" height="26" rx="3" className="fill-sand stroke-brand" strokeWidth="3" />

      {/* Arbre */}
      <rect x="440" y="318" width="7" height="62" rx="3" className="fill-brand-dark" />
      <ellipse cx="443" cy="296" rx="22" ry="42" className="fill-brand" opacity="0.85" />
      <path d="M443 270v40M443 292l-10-9M443 300l10-9" className="stroke-brand-light" strokeWidth="2.5" strokeLinecap="round" />

      {/* Caisse à outils */}
      <path d="M232 348v-10a8 8 0 0 1 8-8h20a8 8 0 0 1 8 8v10" className="stroke-brand-dark" strokeWidth="5" fill="none" />
      <rect x="214" y="346" width="72" height="34" rx="5" className="fill-accent" />
      <rect x="214" y="356" width="72" height="5" className="fill-brand-dark" opacity="0.35" />
      <rect x="244" y="353" width="12" height="11" rx="2" className="fill-sand" />

      {/* Artisan : chaussures et jambes */}
      <rect x="132" y="364" width="34" height="16" rx="7" className="fill-brand-dark" />
      <rect x="174" y="364" width="34" height="16" rx="7" className="fill-brand-dark" />
      <path d="M140 262h60v104h-27v-62h-6v62h-27Z" className="fill-brand" />

      {/* Bras gauche, main sur la hanche */}
      <path d="M134 194L104 232" className="stroke-brand-soft" strokeWidth="22" strokeLinecap="round" />
      <path d="M106 234L138 258" className="stroke-peau" strokeWidth="16" strokeLinecap="round" />
      <circle cx="140" cy="259" r="10" className="fill-peau" />

      {/* Torse : chemise, salopette, bretelles terracotta */}
      <rect x="126" y="176" width="88" height="100" rx="24" className="fill-brand-soft" />
      <rect x="145" y="206" width="50" height="70" rx="6" className="fill-brand" />
      <rect x="158" y="222" width="24" height="17" rx="3" className="fill-brand-dark" opacity="0.4" />
      <path d="M150 210L142 180M190 210L198 180" className="stroke-accent" strokeWidth="7" strokeLinecap="round" />
      <circle cx="150" cy="211" r="3.5" className="fill-sand" />
      <circle cx="190" cy="211" r="3.5" className="fill-sand" />

      {/* Bras droit levé avec la clé à molette */}
      <path d="M206 194L236 210" className="stroke-brand-soft" strokeWidth="22" strokeLinecap="round" />
      <path d="M236 212L242 170" className="stroke-peau" strokeWidth="16" strokeLinecap="round" />
      {/* Clé plate : manche, tête ronde et ouverture en haut (masque) */}
      <mask id="mawkaf-cle-ouverture">
        <rect x="200" y="60" width="90" height="140" fill="white" />
        <rect x="237" y="70" width="14" height="22" rx="2" fill="black" />
      </mask>
      <g transform="rotate(14 244 150)" mask="url(#mawkaf-cle-ouverture)">
        <rect x="237" y="100" width="14" height="78" rx="7" className="fill-brand-dark" />
        <circle cx="244" cy="96" r="19" className="fill-brand-dark" />
        <circle cx="244" cy="160" r="4" className="fill-brand-light" />
      </g>
      <circle cx="242" cy="166" r="11" className="fill-peau" />

      {/* Tête : cou, visage, oreille, casquette */}
      <rect x="160" y="158" width="20" height="22" rx="6" className="fill-peau-ombre" />
      <circle cx="170" cy="138" r="30" className="fill-peau" />
      <circle cx="142" cy="142" r="7" className="fill-peau-ombre" />
      <path d="M141 136a30 22 0 0 1 2-14l-4 18Z" className="fill-ink" />
      <path d="M139 130a31 28 0 0 1 62 0Z" className="fill-brand" />
      <path d="M196 126h24a5 5 0 0 1 0 10h-30Z" className="fill-brand-dark" />
      <circle cx="170" cy="103" r="4" className="fill-accent" />
      <circle cx="170" cy="141" r="3" className="fill-ink" />
      <circle cx="187" cy="141" r="3" className="fill-ink" />
      <path d="M165 133h9M183 133h8" className="stroke-ink" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M170 153q9 7 18 0" className="stroke-ink" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="162" cy="150" r="4" className="fill-accent" opacity="0.35" />
    </svg>
  )
}
