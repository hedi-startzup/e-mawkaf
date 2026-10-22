import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

// Composants de base partagés, conformes aux règles visuelles du CLAUDE.md et au style
// de la maquette : mobile d'abord (375 px), gros boutons, jetons de couleur uniquement.

export function PageMobile({ children }) {
  return <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 py-8">{children}</main>
}

// Titre de page, avec un sous-titre gris facultatif (comme dans la maquette)
export function Titre({ children, sousTitre }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-[26px] leading-tight md:text-[28px]">{children}</h1>
      {sousTitre && <p className="text-muted">{sousTitre}</p>}
    </div>
  )
}

export function Bouton({ children, variante = 'principal', className = '', ...props }) {
  const styles = {
    principal: 'bg-brand text-white shadow-press hover:bg-brand-dark',
    secondaire: 'border-2 border-brand bg-white text-brand hover:bg-brand-light',
  }
  return (
    <button
      className={`min-h-14 w-full rounded-xl px-6 text-lg font-bold active:scale-[0.98] disabled:opacity-60 ${styles[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// Champ de saisie avec libellé (et pictogramme facultatif), aide et message d'erreur.
// Un champ mot de passe a un bouton « œil » pour afficher ce qu'on tape (maquette).
export function Champ({ id, label, icone: Icone, erreur, aide, ...props }) {
  const [visible, setVisible] = useState(false)
  const motDePasse = props.type === 'password'
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center gap-2 font-bold">
        {Icone && <Icone className="h-5 w-5 text-brand" strokeWidth={2.5} aria-hidden="true" />}
        {label}
      </label>
      <span className="relative">
        <input
          id={id}
          aria-invalid={Boolean(erreur)}
          aria-describedby={erreur ? `${id}-erreur` : undefined}
          className={motDePasse ? 'champ pr-12' : 'champ'}
          {...props}
          type={motDePasse && visible ? 'text' : props.type}
        />
        {motDePasse && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            aria-pressed={visible}
            className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-brand"
          >
            {visible
              ? <EyeOff className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
              : <Eye className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />}
          </button>
        )}
      </span>
      {aide && !erreur && <p className="text-muted">{aide}</p>}
      {erreur && <p id={`${id}-erreur`} className="font-bold text-danger">{erreur}</p>}
    </div>
  )
}

// Séparateur « ou » + bouton « Continuer avec Google » (connexion et inscription)
export function BoutonGoogle({ onClick, disabled }) {
  return (
    <>
      <div className="flex items-center gap-3 text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        ou
        <span className="h-px flex-1 bg-line" />
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-6 text-lg font-bold text-ink hover:border-brand active:scale-[0.98] disabled:opacity-60"
      >
        {/* Logo « G » de Google, utilisé tel quel comme le demandent ses règles d'usage du bouton */}
        <svg viewBox="0 0 48 48" className="h-6 w-6" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        Continuer avec Google
      </button>
    </>
  )
}

export function MessageErreur({ children }) {
  if (!children) return null
  return (
    <p role="alert" className="rounded-xl border border-danger bg-white p-4 font-bold text-danger">
      {children}
    </p>
  )
}

// Choix parmi quelques options, en gros boutons (ex. « E-mail » / « Téléphone »)
export function Choix({ legende, options, valeur, onChange, erreur }) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      {legende && <legend className="mb-1.5 font-bold">{legende}</legend>}
      <div className="grid grid-cols-2 gap-3">
        {options.map(({ valeur: v, label, icone: Icone }) => {
          const choisi = v === valeur
          return (
            <button
              key={v}
              type="button"
              aria-pressed={choisi}
              onClick={() => onChange(v)}
              className={`flex min-h-14 items-center justify-center gap-2.5 rounded-xl border p-3 text-lg font-bold transition-colors ${
                choisi ? 'border-brand bg-brand text-white shadow-press' : 'border-line bg-white text-ink hover:border-brand'
              }`}
            >
              {Icone && (
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${choisi ? 'bg-white/15 text-white' : 'bg-sand text-brand'}`}>
                  <Icone className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                </span>
              )}
              {label}
            </button>
          )
        })}
      </div>
      {erreur && <p className="font-bold text-danger">{erreur}</p>}
    </fieldset>
  )
}
