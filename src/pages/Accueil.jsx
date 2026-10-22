import { useNavigate } from 'react-router'
import { Bouton, PageMobile, Titre } from '../components/ui'
import { deconnecter } from '../lib/auth'
import { useSession } from '../lib/session'

// Accueil de chaque rôle. Les stories suivantes le rempliront :
// client → publier une demande (US05), artisan → fil des demandes (US07).
export default function Accueil({ role }) {
  const { utilisateur } = useSession()
  const navigate = useNavigate()
  const prenom = (utilisateur?.user_metadata?.full_name ?? '').split(' ')[0]

  async function seDeconnecter() {
    await deconnecter()
    navigate('/connexion', { replace: true })
  }

  return (
    <PageMobile>
      <Titre>Bonjour {prenom}</Titre>
      <p className="rounded-card border border-line bg-white p-4 text-lg">
        {role === 'artisan'
          ? 'Ici, tu verras bientôt les demandes qui te correspondent.'
          : 'Ici, tu pourras bientôt publier ta demande.'}
      </p>
      <Bouton variante="secondaire" onClick={seDeconnecter}>Se déconnecter</Bouton>
    </PageMobile>
  )
}
