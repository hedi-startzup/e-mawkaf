import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router'
import EspaceConnecte from './components/EspaceConnecte'
import { PageProtegee, PageVisiteur, SessionProvider, useSession } from './lib/session'
import Accueil from './pages/Accueil'
import Connexion from './pages/Connexion'
import FilArtisan from './pages/FilArtisan'
import Inscription from './pages/Inscription'
import ProfilArtisan from './pages/ProfilArtisan'
import PublierDemande from './pages/PublierDemande'

// Les pages artisan reçoivent le profil de la session (US04).
function PageFilArtisan() {
  const { profil } = useSession()
  const navigate = useNavigate()
  return <FilArtisan profil={profil} allerAuProfil={() => navigate('/artisan/profil')} />
}

function PageProfilArtisan() {
  const { profil, mettreAJourProfil } = useSession()
  return <ProfilArtisan profil={profil} surMiseAJour={mettreAJourProfil} />
}

function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/connexion" element={<PageVisiteur><Connexion /></PageVisiteur>} />
          <Route path="/inscription" element={<PageVisiteur><Inscription /></PageVisiteur>} />

          <Route element={<PageProtegee role="client"><EspaceConnecte /></PageProtegee>}>
            <Route path="/client" element={<Accueil />} />
            <Route path="/client/publier" element={<PublierDemande />} />
          </Route>

          <Route element={<PageProtegee role="artisan"><EspaceConnecte artisan /></PageProtegee>}>
            <Route path="/artisan" element={<PageFilArtisan />} />
            <Route path="/artisan/profil" element={<PageProfilArtisan />} />
          </Route>

          <Route path="*" element={<Navigate to="/connexion" replace />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  )
}

export default App
