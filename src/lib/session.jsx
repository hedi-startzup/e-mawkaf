import { createContext, useContext, useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { accueilDe, roleDe } from './auth'
import { supabase } from './supabase'

const SessionContext = createContext({ utilisateur: null, chargement: true })

// Garde la session à jour : elle survit au rechargement de la page.
export function SessionProvider({ children }) {
  const [etat, setEtat] = useState({ utilisateur: null, chargement: true })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEtat({ utilisateur: data.session?.user ?? null, chargement: false })
    })
    const { data } = supabase.auth.onAuthStateChange((_evenement, session) => {
      setEtat({ utilisateur: session?.user ?? null, chargement: false })
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return <SessionContext.Provider value={etat}>{children}</SessionContext.Provider>
}

export function useSession() {
  return useContext(SessionContext)
}

// Page réservée à un rôle : sinon, retour à la connexion ou à son propre accueil.
export function PageProtegee({ role, children }) {
  const { utilisateur, chargement } = useSession()
  if (chargement) return null
  if (!utilisateur) return <Navigate to="/connexion" replace />
  if (roleDe(utilisateur) !== role) return <Navigate to={accueilDe(utilisateur)} replace />
  return children
}

// Page pour les visiteurs (connexion, inscription) : un utilisateur connecté va à son accueil.
export function PageVisiteur({ children }) {
  const { utilisateur, chargement } = useSession()
  if (chargement) return null
  if (utilisateur) return <Navigate to={accueilDe(utilisateur)} replace />
  return children
}
