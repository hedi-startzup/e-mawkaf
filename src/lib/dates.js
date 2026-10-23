// Dates à l'heure de Casablanca, comme la base (private.today_casablanca) :
// une demande est pour aujourd'hui ou demain.

// Renvoie la date du jour au format AAAA-MM-JJ, à l'heure de Casablanca
export function aujourdhuiCasablanca() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca' }).format(new Date())
}

export function demainCasablanca() {
  const date = new Date(`${aujourdhuiCasablanca()}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

// US20 : créneau de la demande (valeurs de la colonne requests.time_slot)
export const CRENEAUX = {
  matin: 'Matin',
  apres_midi: 'Après-midi',
  soir: 'Soir',
}

// « Aujourd'hui · Matin » ; sans créneau (demandes publiées avant US20), seulement le jour
export function libelleJourCreneau(dateIso, creneau) {
  const jour = libelleJour(dateIso)
  return CRENEAUX[creneau] ? `${jour} · ${CRENEAUX[creneau]}` : jour
}

// « Aujourd'hui », « Demain » ou la date en clair (« mer. 21 oct. »)
export function libelleJour(dateIso) {
  if (dateIso === aujourdhuiCasablanca()) return "Aujourd'hui"
  if (dateIso === demainCasablanca()) return 'Demain'
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  }).format(new Date(`${dateIso}T12:00:00Z`))
}
