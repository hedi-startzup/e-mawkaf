import { createClient } from '@supabase/supabase-js'

// Les clés viennent du fichier .env (jamais écrites dans le code).
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Clés Supabase manquantes : copie .env.example en .env et remplis-le.')
}

export const supabase = createClient(url, key)
