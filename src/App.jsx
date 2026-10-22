import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { PageProtegee, PageVisiteur, SessionProvider } from './lib/session'
import Accueil from './pages/Accueil'
import Connexion from './pages/Connexion'
import Inscription from './pages/Inscription'

function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/connexion" element={<PageVisiteur><Connexion /></PageVisiteur>} />
          <Route path="/inscription" element={<PageVisiteur><Inscription /></PageVisiteur>} />
          <Route path="/client" element={<PageProtegee role="client"><Accueil role="client" /></PageProtegee>} />
          <Route path="/artisan" element={<PageProtegee role="artisan"><Accueil role="artisan" /></PageProtegee>} />
          <Route path="*" element={<Navigate to="/connexion" replace />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  )
}

export default App
