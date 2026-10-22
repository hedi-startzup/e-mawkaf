// Données de démo de Mawkaf (US13 / MAW-19), créées en une commande : npm run demo
//
// Le script agit comme de vrais utilisateurs : il crée les comptes par l'inscription
// normale, puis se connecte avec chacun pour publier, faire des offres, choisir,
// terminer et noter. Il n'utilise que la clé publique : aucune clé secrète.
//
// À lancer le matin de la démo : les demandes doivent être pour aujourd'hui ou demain.
// Prérequis dans .env : VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY et DEMO_MOT_DE_PASSE.
// Pour recommencer : coller supabase/nettoyage-demo.sql dans le SQL Editor de Supabase.

import { createClient } from '@supabase/supabase-js'

const URL = process.env.VITE_SUPABASE_URL
const CLE = process.env.VITE_SUPABASE_ANON_KEY
const MOT_DE_PASSE = process.env.DEMO_MOT_DE_PASSE

// Personnages fictifs (dossier, scénario de démo). Téléphones fictifs en 06 00 00 01 xx.
const COMPTES = {
  yasmine: { email: 'yasmine@mawkaf.test', nom: 'Yasmine Bennani', role: 'client', tel: '0600000101' },
  salma: { email: 'salma@mawkaf.test', nom: 'Salma Idrissi', role: 'client', tel: '0600000102' },
  nadia: { email: 'nadia@mawkaf.test', nom: 'Nadia Alaoui', role: 'client', tel: '0600000103' },
  karim: { email: 'karim@mawkaf.test', nom: 'Karim Tazi', role: 'artisan', tel: '0600000104', quartier: 'Maârif' },
  omar: { email: 'omar@mawkaf.test', nom: 'Omar Chraibi', role: 'artisan', tel: '0600000105', quartier: 'Hay Hassani' },
}

// Interventions déjà terminées et notées : Karim 4,5 (2 avis), Omar 4,7 (3 avis)
const HISTORIQUE = [
  { client: 'salma', artisan: 'karim', prix: 200, note: 5, description: 'Chasse d’eau qui coule en continu', commentaire: 'Rapide et efficace.' },
  { client: 'nadia', artisan: 'karim', prix: 150, note: 4, description: 'Robinet de la salle de bain qui goutte', commentaire: null },
  { client: 'salma', artisan: 'omar', prix: 250, note: 5, description: 'Remplacement du chauffe-eau', commentaire: 'Très soigneux, je recommande.' },
  { client: 'nadia', artisan: 'omar', prix: 180, note: 5, description: 'Évier de la cuisine bouché', commentaire: 'Ponctuel et aimable.' },
  { client: 'salma', artisan: 'omar', prix: 120, note: 4, description: 'Fuite sous le lavabo', commentaire: null },
]

function arreter(message) {
  console.error(`\n❌ ${message}\n`)
  process.exit(1)
}

function verifier(etape, { error }) {
  if (error) arreter(`${etape} : ${error.message}`)
}

function aujourdhuiCasablanca(decalageJours = 0) {
  const jour = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca' }).format(new Date())
  const date = new Date(`${jour}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + decalageJours)
  return date.toISOString().slice(0, 10)
}

// Un client Supabase par personnage, sans session partagée
function nouveauClient() {
  return createClient(URL, CLE, { auth: { persistSession: false, autoRefreshToken: false } })
}

// Crée le compte, son profil et son contact (comme l'appli à la première connexion, US03)
async function creerCompte(cle) {
  const compte = COMPTES[cle]
  const sb = nouveauClient()
  const inscription = await sb.auth.signUp({
    email: compte.email,
    password: MOT_DE_PASSE,
    options: { data: { full_name: compte.nom, role: compte.role, phone: compte.tel } },
  })
  verifier(`Inscription de ${compte.nom}`, inscription)
  if (!inscription.data.session) {
    arreter(`Pas de session pour ${compte.nom} : la confirmation d'e-mail est peut-être réactivée dans Supabase.`)
  }
  const id = inscription.data.user.id
  verifier(`Profil de ${compte.nom}`, await sb.from('profiles').insert({ id, role: compte.role, full_name: compte.nom }))
  verifier(`Téléphone de ${compte.nom}`, await sb.from('contacts').insert({ user_id: id, phone: compte.tel }))

  if (compte.role === 'artisan') {
    verifier(`Profil artisan de ${compte.nom}`, await sb.from('profiles').update({
      trades: ['plomberie'], city: 'Casablanca', district: compte.quartier, available_today: true,
    }).eq('id', id))
  }
  console.log(`✓ ${compte.nom} (${compte.role})`)
  return { sb, id }
}

async function publier(client, { metier, description, jour, prix, arrondissement }) {
  const reponse = await client.sb.from('requests').insert({
    client_id: client.id, trade: metier, description, city: 'Casablanca', district: arrondissement,
    service_date: jour, proposed_price: prix,
  }).select('id').single()
  verifier(`Demande « ${description} »`, reponse)
  return reponse.data.id
}

async function main() {
  if (!URL || !CLE) arreter('VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être remplis dans .env.')
  if (!MOT_DE_PASSE || MOT_DE_PASSE.length < 8) {
    arreter('Ajoutez DEMO_MOT_DE_PASSE=… dans .env (8 caractères au moins) : ce sera le mot de passe des comptes de démo.')
  }

  // Ne rien créer en double
  const essai = await nouveauClient().auth.signInWithPassword({ email: COMPTES.yasmine.email, password: MOT_DE_PASSE })
  if (essai.data.session) {
    arreter('Les comptes de démo existent déjà. Pour recommencer, collez supabase/nettoyage-demo.sql dans le SQL Editor de Supabase, puis relancez npm run demo.')
  }

  console.log('\n1. Comptes')
  const p = {}
  for (const cle of Object.keys(COMPTES)) p[cle] = await creerCompte(cle)

  console.log('\n2. Historique : interventions terminées et notées')
  const aujourdhui = aujourdhuiCasablanca()
  for (const h of HISTORIQUE) {
    const client = p[h.client]
    const artisan = p[h.artisan]
    const idDemande = await publier(client, {
      metier: 'plomberie', description: h.description, jour: aujourdhui, prix: h.prix, arrondissement: 'Anfa',
    })
    const offre = await artisan.sb.from('offers')
      .insert({ request_id: idDemande, artisan_id: artisan.id, price: h.prix }).select('id').single()
    verifier(`Offre de ${COMPTES[h.artisan].nom}`, offre)
    verifier('Choix de l’offre', await client.sb.rpc('choisir_offre', { offer_id: offre.data.id }))
    verifier('Intervention terminée', await client.sb.from('requests').update({ status: 'terminee' }).eq('id', idDemande))
    verifier('Note', await client.sb.from('ratings').insert({
      request_id: idDemande, artisan_id: artisan.id, client_id: client.id, score: h.note, comment: h.commentaire,
    }))
    console.log(`✓ ${COMPTES[h.client].nom} → ${COMPTES[h.artisan].nom} : ${h.note} étoiles`)
  }

  console.log('\n3. Demandes ouvertes, pour que le fil des artisans ne soit pas vide')
  await publier(p.nadia, {
    metier: 'plomberie', description: 'Installer un nouveau mitigeur dans la cuisine', jour: aujourdhuiCasablanca(1), prix: 200, arrondissement: 'Maârif',
  })
  await publier(p.salma, {
    metier: 'autre', description: 'Monter une armoire en kit dans la chambre', jour: aujourdhui, prix: null, arrondissement: 'Anfa',
  })
  console.log('✓ 2 demandes ouvertes (une plomberie pour demain, une « Autre » en devis)')

  console.log(`
✅ Données de démo prêtes.
   Comptes (mot de passe : DEMO_MOT_DE_PASSE du fichier .env) :
   - Yasmine (cliente) : ${COMPTES.yasmine.email}
   - Karim (plombier)  : ${COMPTES.karim.email}  → 4,5 (2 avis)
   - Omar (plombier)   : ${COMPTES.omar.email}   → 4,7 (3 avis)
   Le crédit de départ des artisans viendra avec US15.
`)
}

main()
