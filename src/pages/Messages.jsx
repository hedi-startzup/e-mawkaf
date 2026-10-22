import { createElement, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ArrowLeft, Lock, MessagesSquare, RefreshCw, SendHorizontal } from 'lucide-react'
import { Etoile } from '../components/Marque'
import { Titre } from '../components/ui'
import { libelleJour } from '../lib/dates'
import { iconeMetier } from '../lib/icones'
import { MESSAGE_MAX, chargerConversations, chargerMessages, ecouterMessages, envoyerMessage, erreurMessage } from '../lib/messages'
import { useSession } from '../lib/session'

const heure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Casablanca' })

function Avatar({ nom, petit = false }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-sand font-display font-bold text-brand ${petit ? 'h-9 w-9' : 'h-11 w-11 text-lg'}`}
    >
      {nom.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}

function ListeConversations({ conversations, idActive, moi }) {
  return (
    <ul className="flex flex-col gap-1">
      {conversations.map((c) => {
        const active = c.idDemande === idActive
        return (
          <li key={c.idDemande}>
            <Link
              to={{ search: `?demande=${c.idDemande}` }}
              aria-current={active ? 'true' : undefined}
              className={`flex min-h-16 items-center gap-3 rounded-xl p-3 ${active ? 'bg-brand-light' : 'hover:bg-gray-light'}`}
            >
              <Avatar nom={c.nomAutre} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-ink">{c.nomAutre}</span>
                <span className="flex items-center gap-1.5 truncate text-sm text-muted">
                  {createElement(iconeMetier(c.metier?.icon), { className: 'h-4 w-4 shrink-0 text-brand', strokeWidth: 2.5, 'aria-hidden': true })}
                  {c.metier?.label} · {libelleJour(c.jour)}
                </span>
                {c.dernier && (
                  <span className="mt-0.5 block truncate text-sm text-muted">
                    {c.dernier.sender_id === moi ? 'Vous : ' : ''}{c.dernier.body}
                  </span>
                )}
              </span>
              {c.statut === 'terminee' && <Lock className="h-4 w-4 shrink-0 text-muted" strokeWidth={2.5} aria-label="Terminée" />}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function Conversation({ conversation, moi }) {
  const [messages, setMessages] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [texte, setTexte] = useState('')
  const [erreurEnvoi, setErreurEnvoi] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [enDirect, setEnDirect] = useState(true)
  const bas = useRef(null)
  const id = conversation.idDemande
  const ouverte = conversation.statut === 'attribuee'

  // Ajoute un message sans doublon (il peut arriver à la fois par l'envoi et par le Realtime)
  function ajouter(message) {
    setMessages((liste) => (liste?.some((m) => m.id === message.id) ? liste : [...(liste ?? []), message]))
  }

  function recharger() {
    chargerMessages(id).then(({ messages: liste, erreur: e }) => {
      setErreur(e ?? null)
      if (liste) setMessages(liste)
    })
  }

  useEffect(() => {
    let actif = true
    chargerMessages(id).then(({ messages: liste, erreur: e }) => {
      if (!actif) return
      setErreur(e ?? null)
      setMessages(liste ?? [])
    })
    const arreter = ecouterMessages(id, ajouter, setEnDirect)
    return () => {
      actif = false
      arreter()
    }
  }, [id])

  useEffect(() => {
    bas.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  async function envoyer(evenement) {
    evenement.preventDefault()
    const e = erreurMessage(texte)
    setErreurEnvoi(e)
    if (e) return
    setEnvoi(true)
    const { message, erreur: echec } = await envoyerMessage({ idDemande: id, idExpediteur: moi, texte })
    setEnvoi(false)
    if (echec) return setErreurEnvoi(echec)
    setTexte('')
    ajouter(message)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-line p-3 md:p-4">
        <Link to={{ search: '' }} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-brand hover:bg-brand-light md:hidden" aria-label="Retour aux conversations">
          <ArrowLeft className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        </Link>
        <Avatar nom={conversation.nomAutre} petit />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{conversation.nomAutre}</p>
          <p className="truncate text-sm text-muted">{conversation.metier?.label} · {libelleJour(conversation.jour)}</p>
        </div>
        {!enDirect && (
          <button type="button" onClick={recharger} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 font-bold text-brand hover:bg-brand-light">
            <RefreshCw className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            Actualiser
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-surface p-3 md:p-4" aria-live="polite">
        {erreur && <p role="alert" className="font-bold text-danger">{erreur}</p>}
        {!messages && !erreur && <p className="text-muted">Chargement…</p>}
        {messages?.length === 0 && (
          <p className="mx-auto max-w-xs py-8 text-center text-muted">
            Aucun message pour l’instant. Écrivez pour convenir de l’heure ou des détails de l’intervention.
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {messages?.map((m) => {
            const mien = m.sender_id === moi
            return (
              <li key={m.id} className={`flex ${mien ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${mien ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-sand text-ink'}`}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-0.5 text-right text-xs ${mien ? 'text-white/75' : 'text-muted'}`}>{heure.format(new Date(m.created_at))}</p>
                </div>
              </li>
            )
          })}
        </ul>
        <div ref={bas} />
      </div>

      {ouverte ? (
        <form onSubmit={envoyer} noValidate className="flex flex-col gap-1.5 border-t border-line bg-white p-3">
          <div className="flex items-end gap-2">
            <label htmlFor="message" className="sr-only">Votre message</label>
            <textarea
              id="message"
              rows={1}
              maxLength={MESSAGE_MAX}
              value={texte}
              placeholder="Écrire un message…"
              aria-invalid={Boolean(erreurEnvoi)}
              onChange={(e) => { setTexte(e.target.value); setErreurEnvoi(null) }}
              className="champ h-auto min-h-12 resize-none py-2.5"
            />
            <button
              type="submit"
              disabled={envoi}
              aria-label="Envoyer"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-press hover:bg-brand-dark disabled:opacity-60"
            >
              <SendHorizontal className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
          <div className="flex justify-between gap-3 text-sm">
            <span role="alert" className="font-bold text-danger">{erreurEnvoi}</span>
            <span className="shrink-0 tabular-nums text-muted">{texte.trim().length} / {MESSAGE_MAX}</span>
          </div>
        </form>
      ) : (
        <p className="flex items-center gap-2 border-t border-line bg-white p-4 text-muted">
          <Lock className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          Intervention terminée : la conversation est en lecture seule.
        </p>
      )}
    </div>
  )
}

// Messages (maquette n°8) : seulement entre le client et l'artisan retenu, après attribution.
export default function Messages() {
  const { profil } = useSession()
  const [params] = useSearchParams()
  const [resultat, setResultat] = useState({ conversations: null, erreur: null })
  const idDemande = params.get('demande')

  useEffect(() => {
    chargerConversations(profil).then(({ conversations, erreur }) => setResultat({ conversations: conversations ?? [], erreur }))
  }, [profil])

  const { conversations, erreur } = resultat
  const active = conversations?.find((c) => c.idDemande === idDemande) ?? null

  return (
    <section className="flex flex-col gap-5">
      <div className={active ? 'hidden md:block' : ''}>
        <Titre sousTitre="Échangez avec la personne avec qui vous travaillez.">Messages</Titre>
      </div>

      {erreur && <p role="alert" className="font-bold text-danger">{erreur}</p>}
      {!conversations && !erreur && <p className="text-muted">Chargement…</p>}

      {conversations?.length === 0 && (
        <div className="flex flex-col items-center rounded-card border border-line bg-white px-4 py-10 text-center shadow-card">
          <span className="relative mb-5 grid h-28 w-28 place-items-center">
            <Etoile className="absolute inset-0 h-28 w-28 text-sand" />
            <span className="relative grid h-14 w-14 place-items-center rounded-full bg-white text-brand shadow-card">
              <MessagesSquare className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
            </span>
          </span>
          <p className="font-display text-[22px] font-bold text-brand">Aucune conversation</p>
          <p className="mt-2 max-w-sm text-muted">
            {profil.role === 'artisan'
              ? 'Quand un client choisit votre offre, vous pouvez lui écrire ici.'
              : 'Quand vous choisissez une offre, vous pouvez écrire à l’artisan ici.'}
          </p>
        </div>
      )}

      {conversations?.length > 0 && (
        <div className="overflow-hidden rounded-card border border-line bg-white shadow-card md:grid md:h-[calc(100vh-13rem)] md:min-h-[28rem] md:grid-cols-[18rem_1fr]">
          <div className={`overflow-y-auto p-2 md:border-r md:border-line ${active ? 'hidden md:block' : ''}`}>
            <ListeConversations conversations={conversations} idActive={idDemande} moi={profil.id} />
          </div>
          {active ? (
            <div className="flex h-[calc(100vh-11rem)] min-h-[24rem] flex-col md:h-auto">
              <Conversation key={active.idDemande} conversation={active} moi={profil.id} />
            </div>
          ) : (
            <p className="hidden place-items-center p-6 text-center text-muted md:grid">Choisissez une conversation.</p>
          )}
        </div>
      )}
    </section>
  )
}
