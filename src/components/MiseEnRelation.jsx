import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Banknote, MapPinned, MessageCircle, MessagesSquare, Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { chargerAdresseDemande, lienCarte } from '../lib/adresses'
import { libelleJourCreneau } from '../lib/dates'
import { Avatar } from './PhotoProfil'
import SignalerProbleme from './SignalerProbleme'

const TAUX_COMMISSION = 0.14 // commission simulée (RG13, US15) : taux défini par l'équipe

// Numéro au format international sans « + », pour wa.me : 0612345678 → 212612345678
function numeroWhatsApp(telephone) {
  const chiffres = telephone.replace(/[^\d+]/g, '')
  if (chiffres.startsWith('+')) return chiffres.slice(1)
  if (chiffres.startsWith('0')) return `212${chiffres.slice(1)}`
  return chiffres
}

// Affichage lisible : 0612345678 → 06 12 34 56 78 (les numéros internationaux restent tels quels)
function numeroLisible(telephone) {
  return /^0\d{9}$/.test(telephone) ? telephone.replace(/(\d{2})(?=\d)/g, '$1 ') : telephone
}

// Bloc « Mise en relation » (US11), affiché seulement après attribution.
// Le numéro n'est lisible qu'entre le client et l'artisan retenu : c'est la base qui le garantit
// (RLS de contacts, RG08). Si elle refuse, on n'affiche pas de numéro.
export default function MiseEnRelation({ idAutre, role, demande, prix }) {
  const [etat, setEtat] = useState({ charge: false, nom: '', photo: null, telephone: null, adresse: null })

  useEffect(() => {
    let actif = true
    Promise.all([
      supabase.from('profiles').select('full_name, avatar_path').eq('id', idAutre).maybeSingle(),
      supabase.from('contacts').select('phone').eq('user_id', idAutre).maybeSingle(),
      chargerAdresseDemande(demande.id), // US26 : même règle que le téléphone
    ]).then(([profil, contact, adresse]) => {
      if (actif) {
        setEtat({
          charge: true,
          nom: profil.data?.full_name ?? '',
          photo: profil.data?.avatar_path ?? null,
          telephone: contact.data?.phone ?? null,
          adresse,
        })
      }
    })
    return () => {
      actif = false
    }
  }, [idAutre, demande.id])

  const { charge, nom, photo, telephone, adresse } = etat
  const titre = role === 'artisan' ? 'Votre client' : 'Votre artisan'
  const metier = demande.metier?.label ?? 'votre demande'
  const message =
    role === 'artisan'
      ? `Bonjour, je suis l'artisan retenu sur Mawkaf pour votre demande « ${metier} » (${libelleJourCreneau(demande.service_date, demande.time_slot).toLowerCase()}) : ${demande.description}`
      : `Bonjour, je vous ai choisi sur Mawkaf pour ma demande « ${metier} » (${libelleJourCreneau(demande.service_date, demande.time_slot).toLowerCase()}) : ${demande.description}`
  const commission = Math.round(prix * TAUX_COMMISSION)

  return (
    <div className="flex flex-col gap-4 rounded-card border-2 border-ok bg-ok-light p-4">
      <h2 className="text-xl text-ok">Mise en relation</h2>

      {!charge && <p className="text-muted">Chargement du contact…</p>}

      {charge && (
        <div className="flex flex-col gap-1">
          <p className="text-muted">{titre}</p>
          {/* US23 : photo de l'artisan pour le client, celle du client (facultative) pour l'artisan */}
          <div className="flex items-center gap-3">
            <Avatar chemin={photo} nom={nom} />
            <p className="min-w-0 break-words font-display text-xl font-bold text-ink">{nom}</p>
          </div>
          {telephone ? (
            <a href={`tel:${telephone}`} className="inline-flex items-center gap-2 text-lg font-bold text-brand underline">
              <Phone className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
              {numeroLisible(telephone)}
            </a>
          ) : (
            <p className="text-muted">Numéro indisponible pour le moment.</p>
          )}
        </div>
      )}

      {/* US26 : adresse exacte de l'intervention, lisible seulement après attribution */}
      {charge && adresse && (
        <div className="flex flex-col gap-2 rounded-xl bg-white p-3">
          <p className="text-muted">Adresse de l'intervention</p>
          <p className="break-words font-bold text-ink">{adresse}</p>
          <a
            href={lienCarte(adresse, demande.city)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-brand bg-white px-4 font-bold text-brand hover:bg-brand-light active:scale-[0.98]"
          >
            <MapPinned className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
            Ouvrir dans Maps
          </a>
        </div>
      )}

      {charge && telephone && (
        <a
          href={`https://wa.me/${numeroWhatsApp(telephone)}?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-ok px-6 text-lg font-bold text-white hover:opacity-90 active:scale-[0.98]"
        >
          <MessageCircle className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
          Écrire sur WhatsApp
        </a>
      )}

      {/* Messagerie Mawkaf (maquette n°8) : même règle que le téléphone, après attribution */}
      {['attribuee', 'terminee'].includes(demande.status) && (
        <Link
          to={`/${role}/messages?demande=${demande.id}`}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-brand bg-white px-6 text-lg font-bold text-brand hover:bg-brand-light active:scale-[0.98]"
        >
          <MessagesSquare className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
          {demande.status === 'terminee' ? 'Voir les messages' : 'Écrire un message'}
        </Link>
      )}

      <div className="flex items-start gap-2 rounded-xl bg-white p-3">
        <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-ok" strokeWidth={2.5} aria-hidden="true" />
        <p>
          Paiement en espèces, directement entre vous, à la fin de l'intervention ({prix} DH).
          {role === 'artisan'
            ? ` Commission Mawkaf simulée : ${commission} DH (14 %), débitée de votre crédit. Simulation, aucun argent réel.`
            : ' La mise en relation est gratuite pour vous.'}
        </p>
      </div>

      {/* US25 : signaler un problème à Mawkaf (litige), tant que la demande est attribuée ou terminée */}
      {['attribuee', 'terminee'].includes(demande.status) && <SignalerProbleme demande={demande} />}
    </div>
  )
}
