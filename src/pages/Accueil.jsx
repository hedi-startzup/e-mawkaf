import { Etoile } from '../components/Marque'
import { useSession } from '../lib/session'

// Accueil du client. US05 y ajoutera la publication d'une demande.
export default function Accueil() {
  const { profil } = useSession()
  const prenom = (profil?.full_name ?? '').split(' ')[0]

  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-[28px] leading-tight">Bonjour {prenom}</h1>
      <div className="flex flex-col items-center px-4 py-10 text-center">
        <Etoile className="mb-5 h-32 w-32 text-sand-deep" />
        <p className="font-display text-[22px] font-bold text-brand">Votre espace client arrive bientôt</p>
        <p className="mt-2 text-muted">Vous pourrez bientôt publier votre demande ici.</p>
      </div>
    </section>
  )
}
