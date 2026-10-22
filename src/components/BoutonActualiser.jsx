import { useEffect, useState } from 'react'
import { Check, RefreshCw } from 'lucide-react'

// Solution de repli si le temps réel ne répond pas (US10) : recharger à la main.
// Le bouton montre qu'il a bien travaillé (icône qui tourne, puis « À jour »),
// sinon on croit qu'il ne fait rien quand rien n'a changé.
export default function BoutonActualiser({ onClick }) {
  const [etape, setEtape] = useState('repos') // repos → en_cours → fait → repos

  useEffect(() => {
    if (etape === 'repos') return
    const minuteur = setTimeout(() => setEtape(etape === 'en_cours' ? 'fait' : 'repos'), etape === 'en_cours' ? 700 : 1500)
    return () => clearTimeout(minuteur)
  }, [etape])

  return (
    <button
      type="button"
      disabled={etape === 'en_cours'}
      onClick={() => {
        setEtape('en_cours')
        onClick()
      }}
      className="inline-flex min-h-12 items-center gap-2 self-start rounded-full border-2 border-brand bg-white px-4 font-bold text-brand hover:bg-brand-light active:scale-[0.97] disabled:opacity-70"
    >
      {etape === 'fait' ? (
        <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
      ) : (
        <RefreshCw
          className={`h-5 w-5 ${etape === 'en_cours' ? 'animate-spin' : ''}`}
          strokeWidth={2.5}
          aria-hidden="true"
        />
      )}
      {etape === 'en_cours' ? 'Actualisation…' : etape === 'fait' ? 'À jour' : 'Actualiser'}
    </button>
  )
}
