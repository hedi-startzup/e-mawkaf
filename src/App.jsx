import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router'
import EspaceConnecte from './components/EspaceConnecte'
import { PageACompleter, PageProtegee, PageVisiteur, SessionProvider, useSession } from './lib/session'
import Accueil from './pages/Accueil'
import Bienvenue from './pages/Bienvenue'
import CompleterProfil from './pages/CompleterProfil'
import Connexion from './pages/Connexion'
import DemandeArtisan from './pages/DemandeArtisan'
import DetailDemande from './pages/DetailDemande'
import FilArtisan from './pages/FilArtisan'
import Inscription from './pages/Inscription'
import MesOffres from './pages/MesOffres'
import Messages from './pages/Messages'
import Parametres from './pages/Parametres'
import ProfilArtisan from './pages/ProfilArtisan'
import PublierDemande from './pages/PublierDemande'
import TableauBordArtisan from './pages/TableauBordArtisan'

// Les pages artisan reçoivent le profil de la session (US04).
function PageFilArtisan() {
  const { profil } = useSession()
  const navigate = useNavigate()
  return <FilArtisan profil={profil} allerAuProfil={() => navigate('/artisan/profil')} />
}

function PageTableauBordArtisan() {
  const { profil, mettreAJourProfil } = useSession()
  return <TableauBordArtisan profil={profil} surMiseAJour={mettreAJourProfil} />
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
          <Route path="/" element={<PageVisiteur><Bienvenue /></PageVisiteur>} />
          <Route path="/connexion" element={<PageVisiteur><Connexion /></PageVisiteur>} />
          <Route path="/inscription" element={<PageVisiteur><Inscription /></PageVisiteur>} />
          <Route path="/completer-profil" element={<PageACompleter><CompleterProfil /></PageACompleter>} />

          <Route element={<PageProtegee role="client"><EspaceConnecte /></PageProtegee>}>
            <Route path="/client" element={<Accueil />} />
            <Route path="/client/publier" element={<PublierDemande />} />
            <Route path="/client/demandes/:id" element={<DetailDemande />} />
            <Route path="/client/messages" element={<Messages />} />
            <Route path="/client/parametres" element={<Parametres />} />
          </Route>

          <Route element={<PageProtegee role="artisan"><EspaceConnecte artisan /></PageProtegee>}>
            <Route path="/artisan" element={<PageTableauBordArtisan />} />
            <Route path="/artisan/fil" element={<PageFilArtisan />} />
            <Route path="/artisan/demandes/:id" element={<DemandeArtisan />} />
            <Route path="/artisan/offres" element={<MesOffres />} />
            <Route path="/artisan/profil" element={<PageProfilArtisan />} />
            <Route path="/artisan/messages" element={<Messages />} />
            <Route path="/artisan/parametres" element={<Parametres />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  )
}

export default App
