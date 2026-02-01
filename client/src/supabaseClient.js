import { createClient } from '@supabase/supabase-js'

// Ambil dari environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validasi agar tidak error jika lupa isi .env
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL atau Key belum disetting di file .env')
}

export const supabase = createClient(supabaseUrl, supabaseKey)