import { useState } from 'react'
import { AlertCircle, Sun } from 'lucide-react'
import { supabase } from '../lib/supabase'

// Interrupteur « Disponible aujourd'hui » (RG12), utilisé par le profil et le tableau de bord de l'artisan.
// Enregistré dès qu'on le touche, sans passer par « Enregistrer » ; en cas d'échec, on revient en arrière.
export default function Disponibilite({ profil, surMiseAJour }) {
  const [erreur, setErreur] = useState('')
  const dispo = profil.available_today

  async function basculer() {
    const nouvelleValeur = !dispo
    setErreur('')
    surMiseAJour({ ...profil, available_today: nouvelleValeur })
    // .select() : si la base refuse en silence (aucune ligne modifiée), on le voit (bug MAW-29)
    const { data, error } = await supabase
      .from('profiles')
      .update({ available_today: nouvelleValeur })
      .eq('id', profil.id)
      .select('id')
    if (error || !data?.length) {
      surMiseAJour({ ...profil, available_today: !nouvelleValeur })
      setErreur("Votre disponibilité n'a pas pu être enregistrée. Réessayez.")
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={dispo}
        onClick={basculer}
        className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors ${
          dispo ? 'border-ok bg-ok-light' : 'border-line bg-white'
        }`}
      >
        <span
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${
            dispo ? 'bg-white text-ok' : 'bg-sand text-brand'
          }`}
        >
          <Sun className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold">Disponible aujourd'hui</span>
          <span className={`block text-sm ${dispo ? 'font-bold text-ok' : 'text-muted'}`}>
            {dispo
              ? 'Oui : vous voyez les demandes pour aujourd’hui et demain.'
              : 'Non : vous ne voyez que les demandes pour demain.'}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`relative h-9 w-16 shrink-0 rounded-full transition-colors ${
            dispo ? 'bg-ok' : 'bg-line'
          }`}
        >
          <span
            className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-all ${
              dispo ? 'left-8' : 'left-1'
            }`}
          />
        </span>
      </button>
      {erreur && (
        <p role="alert" className="flex items-start gap-1.5 font-bold text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          <span>{erreur}</span>
        </p>
      )}
    </div>
  )
}
