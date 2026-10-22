import { useEffect, useState } from 'react'
import { Inbox, LogOut, UserRound } from 'lucide-react'
import { supabase } from './lib/supabase'
import { Filigrane, Logo } from './components/Marque'
import Connexion from './pages/Connexion'
import FilArtisan from './pages/FilArtisan'
import ProfilArtisan from './pages/ProfilArtisan'

function App() {
  const [session, setSession] = useState(null)
  const [verificationSession, setVerificationSession] = useState(true)

  // Session Supabase : retrouvée au rechargement, mise à jour à la connexion et à la déconnexion.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setVerificationSession(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_evenement, nouvelleSession) => {
      setSession(nouvelleSession)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (verificationSession) return null
  if (!session) return <Connexion />
  // key : on repart de zéro si un autre compte se connecte.
  return <EspaceConnecte key={session.user.id} idUtilisateur={session.user.id} />
}

function EspaceConnecte({ idUtilisateur }) {
  const [profil, setProfil] = useState(null)
  const [erreurProfil, setErreurProfil] = useState('')
  const [page, setPage] = useState('fil')

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, role, full_name, city, district, neighborhood, trades, available_today')
      .eq('id', idUtilisateur)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setErreurProfil('Impossible de charger votre profil. Rechargez la page.')
        else if (!data) setErreurProfil("Votre profil n'existe pas encore.")
        else setProfil(data)
      })
  }, [idUtilisateur])

  const estArtisan = profil?.role === 'artisan'

  return (
    <div className="min-h-screen max-w-md mx-auto w-full flex flex-col">
      <header className="sticky top-0 z-30 overflow-hidden border-b border-sand-deep bg-sand">
        <Filigrane className="-right-6 -top-10 h-28 w-28" />
        <div className="relative flex h-16 items-center justify-between gap-3 px-4">
          <Logo />
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            aria-label="Se déconnecter"
            title="Se déconnecter"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-brand shadow-card hover:bg-brand-light"
          >
            <LogOut className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pt-5 pb-28">
        {erreurProfil && <p className="text-danger">{erreurProfil}</p>}
        {!profil && !erreurProfil && <p className="text-muted">Chargement…</p>}
        {profil && !estArtisan && (
          <p className="text-muted">Bonjour {profil.full_name}, votre espace client arrive bientôt.</p>
        )}
        {estArtisan && page === 'fil' && (
          <FilArtisan profil={profil} allerAuProfil={() => setPage('profil')} />
        )}
        {estArtisan && page === 'profil' && (
          <ProfilArtisan profil={profil} surMiseAJour={setProfil} />
        )}
      </main>

      {estArtisan && (
        <nav
          aria-label="Navigation"
          className="fixed inset-x-0 bottom-0 z-30 mx-auto grid w-full max-w-md grid-cols-2 border-t border-line bg-white shadow-float"
        >
          {[
            ['fil', 'Mon fil', Inbox],
            ['profil', 'Mon profil', UserRound],
          ].map(([cle, libelle, Icone]) => {
            const active = page === cle
            return (
              <button
                key={cle}
                type="button"
                onClick={() => setPage(cle)}
                aria-current={active ? 'page' : undefined}
                className={`flex h-[72px] flex-col items-center justify-center gap-1 font-bold ${
                  active ? 'text-brand' : 'text-muted'
                }`}
              >
                <span
                  className={`grid h-9 w-14 place-items-center rounded-full ${active ? 'bg-sand' : ''}`}
                >
                  <Icone className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
                </span>
                {libelle}
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}

export default App
