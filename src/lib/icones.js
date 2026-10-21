// Pictogrammes des métiers (bibliothèque Lucide, licence ISC).
// La colonne trades.icon contient le nom Lucide ; on le traduit ici en composant.
// On liste les icônes une par une pour ne pas charger toute la bibliothèque.
import {
  BrickWall,
  CircleHelp,
  Grid3x3,
  Hammer,
  KeyRound,
  Paintbrush,
  Refrigerator,
  Snowflake,
  Sparkles,
  Sprout,
  Truck,
  Wrench,
  Zap,
} from 'lucide-react'

const ICONES = {
  'brick-wall': BrickWall,
  'circle-help': CircleHelp,
  'grid-3x3': Grid3x3,
  hammer: Hammer,
  'key-round': KeyRound,
  paintbrush: Paintbrush,
  refrigerator: Refrigerator,
  snowflake: Snowflake,
  sparkles: Sparkles,
  sprout: Sprout,
  truck: Truck,
  wrench: Wrench,
  zap: Zap,
}

// Icône inconnue : on affiche le point d'interrogation plutôt que rien.
export function iconeMetier(nom) {
  return ICONES[nom] ?? CircleHelp
}
