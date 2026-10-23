import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Camera, Check } from 'lucide-react'
import { envoyerPhoto, lienPhoto } from '../lib/photos'

const TAILLES = {
  petit: 'h-12 w-12 text-lg',
  moyen: 'h-16 w-16 text-2xl',
  grand: 'h-24 w-24 text-4xl',
}

// Photo de profil ronde (US23) ; sans photo, l'initiale du nom dans un rond
export function Avatar({ chemin, nom, taille = 'moyen' }) {
  const [lien, setLien] = useState({ chemin: null, url: null })

  useEffect(() => {
    if (!chemin) return
    let actif = true
    lienPhoto(chemin).then((url) => {
      if (actif) setLien({ chemin, url })
    })
    return () => {
      actif = false
    }
  }, [chemin])

  const classes = `${TAILLES[taille]} shrink-0 rounded-full`
  const url = lien.chemin === chemin ? lien.url : null
  if (chemin && url) {
    return <img src={url} alt={`Photo de ${nom}`} className={`${classes} border-2 border-white object-cover shadow-card`} />
  }
  return (
    <span className={`${classes} grid place-items-center bg-brand font-display font-bold text-white`} aria-hidden="true">
      {(nom ?? '').trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}

// Bloc « Ma photo » : choisir ou changer sa photo (obligatoire pour l'artisan, facultative pour le client)
export function ChoixPhoto({ profil, surMiseAJour, obligatoire = false }) {
  const champ = useRef(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [message, setMessage] = useState('')

  async function choisir(evenement) {
    const fichier = evenement.target.files?.[0]
    evenement.target.value = '' // permet de rechoisir le même fichier après une erreur
    if (!fichier) return
    setErreur(null)
    setMessage('')
    setEnvoi(true)
    const { chemin, erreur: e } = await envoyerPhoto(profil.id, fichier, profil.avatar_path)
    setEnvoi(false)
    if (e) return setErreur(e)
    surMiseAJour({ ...profil, avatar_path: chemin })
    setMessage('Photo enregistrée.')
  }

  const aPhoto = Boolean(profil.avatar_path)

  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-white p-5 shadow-card md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl">
          Ma photo{' '}
          {!obligatoire && <span className="font-normal text-muted">(facultative)</span>}
        </h2>
        <p className="text-muted">
          {!obligatoire
            ? "Visible par l'artisan que vous choisissez."
            : aPhoto
              ? 'Votre photo apparaît sur vos offres.'
              : 'Ajoutez votre photo pour commencer à faire des offres.'}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Avatar chemin={profil.avatar_path} nom={profil.full_name} taille="grand" />
        <p className="text-muted">Un visage bien visible, de face. JPEG ou PNG, 5 Mo au plus.</p>
      </div>

      {erreur && (
        <p role="alert" className="flex items-start gap-1.5 font-bold text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          <span>{erreur}</span>
        </p>
      )}
      {message && (
        <p role="status" className="flex items-center gap-1.5 rounded-xl bg-ok-light px-3 py-2 font-bold text-ok">
          <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
          {message}
        </p>
      )}

      <input ref={champ} type="file" accept="image/jpeg,image/png" onChange={choisir} className="hidden" />
      <button
        type="button"
        disabled={envoi}
        onClick={() => champ.current?.click()}
        className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-xl px-6 text-lg font-bold active:scale-[0.98] disabled:opacity-60 ${
          aPhoto ? 'border-2 border-brand bg-white text-brand hover:bg-brand-light' : 'bg-brand text-white shadow-press hover:bg-brand-dark'
        }`}
      >
        <Camera className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
        {envoi ? 'Envoi de la photo…' : aPhoto ? 'Changer ma photo' : 'Choisir une photo'}
      </button>
    </div>
  )
}
