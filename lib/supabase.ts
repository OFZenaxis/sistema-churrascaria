import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
// SERVICE_ROLE_KEY bypassa RLS — preferido para Server Actions.
// Se não estiver definido, cai no anon key (requer política RLS permissiva no bucket).
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabaseAdmin = createClient(url, key, {
  auth: { persistSession: false },
})
