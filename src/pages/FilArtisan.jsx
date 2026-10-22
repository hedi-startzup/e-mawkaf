import { UserRound } from 'lucide-react'
import { Etoile } from '../components/Marque'

// Fil de l'artisan.
// US04 : sans métier, un message l'invite à compléter son profil.
// La liste des demandes elle-même arrive dans une story suivante.
export default function FilArtisan({ profil, allerAuProfil }) {
  const sansMetier = profil.trades.length === 0

  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-[28px] leading-tight">Mon fil</h1>

      {sansMetier ? (
        <div className="flex flex-col gap-3 rounded-card border border-sand-deep bg-sand p-4">
          <p className="font-display text-xl font-bold text-brand">Complétez votre profil</p>
          <p>
            Choisissez au moins un métier pour voir les demandes des clients qui vous
            concernent.
          </p>
          <button
            type="button"
            onClick={allerAuProfil}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-brand px-6 text-lg font-bold text-white shadow-press hover:bg-brand-dark active:scale-[0.98]"
          >
            <UserRound className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
            Compléter mon profil
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center px-4 py-10 text-center">
          <Etoile className="mb-5 h-32 w-32 text-sand-deep" />
          <p className="font-display text-[22px] font-bold text-brand">Pas encore de demande</p>
          <p className="mt-2 text-muted">Les demandes des clients apparaîtront ici.</p>
        </div>
      )}
    </section>
  )
}
