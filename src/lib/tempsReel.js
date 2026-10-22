import { useEffect, useRef } from 'react'
import { supabase } from './supabase'

// Temps réel (US10) : appelle surChangement dès qu'une ligne suivie change dans la base.
// abonnements : [{ table: 'offers', filter: 'request_id=eq.…' }, …]
// Realtime est activé sur offers et requests (US02) et respecte la RLS :
// chacun ne reçoit que les changements des lignes qu'il a le droit de lire.
export function useTempsReel(cle, abonnements, surChangement) {
  const rappel = useRef(surChangement)
  useEffect(() => {
    rappel.current = surChangement
  })

  const description = JSON.stringify(abonnements)
  useEffect(() => {
    if (!cle) return
    const canal = supabase.channel(`mawkaf-${cle}`)
    for (const { table, filter } of JSON.parse(description)) {
      canal.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) },
        () => rappel.current(),
      )
    }
    canal.subscribe()
    return () => {
      supabase.removeChannel(canal)
    }
  }, [cle, description])
}
