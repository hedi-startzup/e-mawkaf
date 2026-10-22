// Composants de base partagés, conformes aux règles visuelles du CLAUDE.md :
// mobile d'abord (375 px), boutons de 48 px minimum, couleurs de la palette uniquement.

export function PageMobile({ children }) {
  return <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 py-8">{children}</main>
}

export function Titre({ children }) {
  return <h1 className="text-3xl font-bold text-brand">{children}</h1>
}

export function Bouton({ children, variante = 'principal', className = '', ...props }) {
  const styles = {
    principal: 'bg-brand text-white hover:bg-brand-dark disabled:opacity-60',
    secondaire: 'border-2 border-brand bg-white text-brand hover:bg-brand-light',
  }
  return (
    <button
      className={`min-h-12 w-full rounded-full px-6 text-lg font-semibold transition-colors ${styles[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Champ({ id, label, erreur, aide, ...props }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-lg font-semibold">{label}</label>
      <input
        id={id}
        aria-invalid={Boolean(erreur)}
        aria-describedby={erreur ? `${id}-erreur` : undefined}
        className={`min-h-12 w-full rounded-xl border-2 bg-white px-4 text-lg outline-none focus:border-brand ${
          erreur ? 'border-danger' : 'border-line'
        }`}
        {...props}
      />
      {aide && !erreur && <p className="text-muted">{aide}</p>}
      {erreur && <p id={`${id}-erreur`} className="text-danger">{erreur}</p>}
    </div>
  )
}

export function MessageErreur({ children }) {
  if (!children) return null
  return (
    <p role="alert" className="rounded-card border-2 border-danger bg-white p-4 text-danger">
      {children}
    </p>
  )
}

// Choix parmi quelques options, en gros boutons (ex. « E-mail » / « Téléphone »)
export function Choix({ legende, options, valeur, onChange, erreur }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-lg font-semibold">{legende}</legend>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const choisi = option.valeur === valeur
          return (
            <button
              key={option.valeur}
              type="button"
              aria-pressed={choisi}
              onClick={() => onChange(option.valeur)}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-card border-2 p-3 text-lg font-semibold ${
                choisi ? 'border-brand bg-brand-light text-brand' : 'border-line bg-white text-ink'
              }`}
            >
              {option.icone && <span aria-hidden="true" className="text-3xl">{option.icone}</span>}
              {option.label}
            </button>
          )
        })}
      </div>
      {erreur && <p className="text-danger">{erreur}</p>}
    </fieldset>
  )
}
