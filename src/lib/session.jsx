import { createContext, useContext, useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { PageMobile } from '../components/ui'
import { accueilDe, obtenirProfil } from './auth'
import { supabase } from './supabase'

const SessionContext = createContext({ utilisateur: null, profil: null, erreurProfil: null, chargement: true })

// Garde la session et le profil à jour : ils survivent au rechargement de la page.
export function SessionProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null)
  const [sessionVerifiee, setSessionVerifiee] = useState(false)
  const [resultatProfil, setResultatProfil] = useState({ idUtilisateur: null, profil: null, erreur: null })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUtilisateur(data.session?.user ?? null)
      setSessionVerifiee(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_evenement, session) => {
      setUtilisateur(session?.user ?? null)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // Le profil se charge (ou se crée) à chaque changement de compte.
  // Hors du rappel onAuthStateChange : Supabase déconseille d'y appeler la base.
  const idUtilisateur = utilisateur?.id
  useEffect(() => {
    if (!idUtilisateur) return
    let actif = true
    obtenirProfil(utilisateur).then(({ profil, erreur }) => {
      if (actif) setResultatProfil({ idUtilisateur, profil: profil ?? null, erreur: erreur ?? null })
    })
    return () => { actif = false }
    // On ne recharge le profil que si le compte change, pas à chaque rafraîchissement de session.
  }, [idUtilisateur]) // eslint-disable-line react-hooks/exhaustive-deps

  const profilAJour = resultatProfil.idUtilisateur === idUtilisateur
  const valeur = {
    utilisateur,
    profil: profilAJour ? resultatProfil.profil : null,
    erreurProfil: profilAJour ? resultatProfil.erreur : null,
    chargement: !sessionVerifiee || (Boolean(utilisateur) && !profilAJour),
  }

  return <SessionContext.Provider value={valeur}>{children}</SessionContext.Provider>
}

export function useSession() {
  return useContext(SessionContext)
}

function ErreurProfil({ message }) {
  return (
    <PageMobile>
      <p role="alert" className="rounded-card border-2 border-danger bg-white p-4 text-lg text-danger">{message}</p>
    </PageMobile>
  )
}

// Page réservée à un rôle : sinon, retour à la connexion ou à son propre accueil.
export function PageProtegee({ role, children }) {
  const { utilisateur, profil, erreurProfil, chargement } = useSession()
  if (chargement) return null
  if (!utilisateur) return <Navigate to="/connexion" replace />
  if (erreurProfil) return <ErreurProfil message={erreurProfil} />
  if (profil.role !== role) return <Navigate to={accueilDe(profil)} replace />
  return children
}

// Page pour les visiteurs (connexion, inscription) : un utilisateur connecté va à son accueil.
export function PageVisiteur({ children }) {
  const { utilisateur, profil, erreurProfil, chargement } = useSession()
  if (chargement) return null
  if (utilisateur && erreurProfil) return <ErreurProfil message={erreurProfil} />
  if (utilisateur) return <Navigate to={accueilDe(profil)} replace />
  return children
}
