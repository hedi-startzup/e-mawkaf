import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Banknote, CircleCheck, ClipboardList, HandCoins, Lock, Star, UserRound, Wrench } from 'lucide-react'
import { Logo } from '../components/Marque'
import { MessageErreur, Titre, Tuile } from '../components/ui'
import { accueilDe } from '../lib/auth'
import { STATUTS_DEMANDE } from '../lib/demandes'
import { useSession } from '../lib/session'
import { supabase } from '../lib/supabase'

const date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Casablanca' })

// Tableau de bord administrateur (US24 partie 1) : lecture seule, réservé aux comptes de private.admins.
// La base refuse les chiffres à tout autre compte (fonction tableau_admin) ; aucun téléphone ni adresse (RG08).
export default function Admin() {
  const { profil } = useSession()
  const [etat, setEtat] = useState({ charge: false, admin: false, donnees: null, erreur: null })

  useEffect(() => {
    let actif = true
    supabase.rpc('est_admin').then(async ({ data: admin, error }) => {
      if (!actif) return
      if (error) return setEtat({ charge: true, admin: false, donnees: null, erreur: 'Impossible de vérifier vos droits. Rechargez la page.' })
      if (!admin) return setEtat({ charge: true, admin: false, donnees: null, erreur: null })
      const reponse = await supabase.rpc('tableau_admin')
      if (!actif) return
      setEtat({
        charge: true,
        admin: true,
        donnees: reponse.data,
        erreur: reponse.error ? 'Impossible de charger les chiffres. Rechargez la page.' : null,
      })
    })
    return () => {
      actif = false
    }
  }, [])

  const { charge, admin, donnees, erreur } = etat
  const demandes = donnees?.demandes ?? {}
  const totalDemandes = Object.values(demandes).reduce((a, b) => a + b, 0)

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="border-b border-line bg-white">
        <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">
          <Logo />
          <span className="rounded-full bg-sand px-3 py-1 text-sm font-bold text-brand-dark">Administration</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
        <Link to={profil ? accueilDe(profil) : '/'} className="inline-flex min-h-12 items-center gap-2 self-start font-bold text-brand">
          <ArrowLeft className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
          Retour à mon espace
        </Link>

        {!charge && <p className="text-muted">Chargement…</p>}
        {charge && erreur && <MessageErreur>{erreur}</MessageErreur>}

        {charge && !admin && !erreur && (
          <p className="flex items-center gap-2 rounded-card border border-line bg-white p-5 font-bold text-muted">
            <Lock className="h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            Accès réservé aux administrateurs.
          </p>
        )}

        {admin && donnees && (
          <>
            <Titre sousTitre="Activité de Mawkaf, en lecture seule.">Tableau de bord</Titre>

            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Tuile icone={UserRound} libelle="Clients" valeur={donnees.clients} />
              <Tuile icone={Wrench} libelle="Artisans" valeur={donnees.artisans} />
              <Tuile icone={ClipboardList} libelle="Demandes" valeur={totalDemandes} />
              <Tuile icone={HandCoins} libelle="Offres" valeur={donnees.offres} />
              <Tuile icone={CircleCheck} libelle="Demandes terminées" valeur={demandes.terminee ?? 0} />
              <Tuile icone={Banknote} libelle="Commissions simulées" valeur={`${donnees.commissions} DH`} />
              <Tuile icone={Star} libelle="Note moyenne" valeur={donnees.note_moyenne ?? '–'} />
              <Tuile icone={Star} libelle="Avis" valeur={donnees.nb_avis} />
            </ul>

            <section className="flex flex-col gap-3 rounded-card border border-line bg-white p-5 shadow-card">
              <h2 className="text-xl">Demandes par statut</h2>
              <ul className="flex flex-wrap gap-2">
                {Object.entries(STATUTS_DEMANDE).map(([cle, statut]) => (
                  <li key={cle} className={`rounded-full px-3 py-1 font-bold ${statut.classes}`}>
                    {statut.label} : {demandes[cle] ?? 0}
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid items-start gap-5 md:grid-cols-2">
              <section className="flex flex-col gap-3 rounded-card border border-line bg-white p-5 shadow-card">
                <h2 className="text-xl">10 dernières demandes</h2>
                {donnees.dernieres_demandes.length === 0 && <p className="text-muted">Aucune demande pour le moment.</p>}
                <ul className="flex flex-col divide-y divide-line">
                  {donnees.dernieres_demandes.map((d) => {
                    const statut = STATUTS_DEMANDE[d.status] ?? STATUTS_DEMANDE.ouverte
                    return (
                      <li key={`${d.created_at}-${d.metier}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                        <div className="min-w-0">
                          <p className="font-bold">{d.metier} · {d.ville}</p>
                          <p className="text-sm text-muted">
                            {date.format(new Date(d.created_at))} · {d.prix ? `${d.prix} DH` : 'Devis'}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${statut.classes}`}>{statut.label}</span>
                      </li>
                    )
                  })}
                </ul>
              </section>

              <section className="flex flex-col gap-3 rounded-card border border-line bg-white p-5 shadow-card">
                <h2 className="text-xl">Artisans les mieux notés</h2>
                {donnees.meilleurs_artisans.length === 0 && <p className="text-muted">Aucun avis pour le moment.</p>}
                <ol className="flex flex-col divide-y divide-line">
                  {donnees.meilleurs_artisans.map((a, i) => (
                    <li key={`${a.nom}-${i}`} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="min-w-0 truncate font-bold">{i + 1}. {a.nom}</span>
                      <span className="inline-flex shrink-0 items-center gap-1 font-bold">
                        <Star className="h-4 w-4 fill-accent text-accent" aria-hidden="true" />
                        {a.note} <span className="font-normal text-muted">({a.avis} avis)</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
