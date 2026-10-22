// Arrondissements de Casablanca (16 arrondissements officiels), triés de A à Z.
// Utilisés pour la liste déroulante « Arrondissement » des demandes et des profils.
// Le quartier précis est saisi en texte libre (facultatif) : pas de liste officielle fiable.
export const ARRONDISSEMENTS_CASABLANCA = [
  'Aïn Chock',
  'Aïn Sebaâ',
  'Al Fida',
  'Anfa',
  "Ben M'Sick",
  'Hay Hassani',
  'Hay Mohammadi',
  'Maârif',
  'Mers Sultan',
  'Moulay Rachid',
  'Roches Noires',
  'Sbata',
  'Sidi Belyout',
  'Sidi Bernoussi',
  'Sidi Moumen',
  'Sidi Othmane',
]

// --- Villes (US17) ---
// Les 6 grandes villes découpées en arrondissements ont leur liste ; les autres villes
// n'ont pas d'arrondissements : seul le quartier (texte libre, facultatif) est demandé.
// Listes à vérifier sur une source officielle avant la mise en ligne.
export const ARRONDISSEMENTS_PAR_VILLE = {
  Casablanca: ARRONDISSEMENTS_CASABLANCA,
  Fès: ['Agdal', 'El Mariniyine', 'Fès-Médina', 'Jnan El Ouard', 'Saïss', 'Zouagha'],
  Marrakech: ['Annakhil', 'Guéliz', 'Médina', 'Ménara', 'Sidi Youssef Ben Ali'],
  Rabat: ['Agdal-Riyad', 'El Youssoufia', 'Hassan', 'Souissi', 'Yacoub El Mansour'],
  Salé: ['Bab Lamrissa', 'Bettana', 'Hssaine', 'Layayda', 'Tabriquet'],
  Tanger: ['Bni Makada', 'Charf-Mghogha', 'Charf-Souani', 'Tanger-Médina'],
}

// 20 villes : Casablanca d'abord (ville de lancement), puis les autres de A à Z
export const VILLES = [
  'Casablanca',
  ...[
    'Agadir', 'Béni Mellal', 'El Jadida', 'Fès', 'Kénitra', 'Khouribga', 'Marrakech', 'Meknès',
    'Mohammédia', 'Nador', 'Oujda', 'Rabat', 'Safi', 'Salé', 'Settat', 'Tanger', 'Taza', 'Témara',
    'Tétouan',
  ].sort((a, b) => a.localeCompare(b, 'fr')),
]

// Arrondissements d'une ville ([] si la ville n'en a pas)
export function arrondissementsDe(ville) {
  return ARRONDISSEMENTS_PAR_VILLE[ville] ?? []
}
