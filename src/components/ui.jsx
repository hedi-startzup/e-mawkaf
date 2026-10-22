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
export function Champ({ id, label, icone: Icone, erreur, aide, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center gap-2 font-bold">
        {Icone && <Icone className="h-5 w-5 text-brand" strokeWidth={2.5} aria-hidden="true" />}
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(erreur)}
        aria-describedby={erreur ? `${id}-erreur` : undefined}
        className="champ"
        {...props}
      />
      {aide && !erreur && <p className="text-muted">{aide}</p>}
      {erreur && <p id={`${id}-erreur`} className="font-bold text-danger">{erreur}</p>}
    </div>
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
