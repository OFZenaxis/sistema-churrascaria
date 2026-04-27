import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!url) throw new Error('[FATAL] NEXT_PUBLIC_SUPABASE_URL não definida.')

// BUG-062: SERVICE_ROLE_KEY é obrigatória — sem ela, operações que exigem bypass de RLS falham silenciosamente
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!key) throw new Error('[FATAL] SUPABASE_SERVICE_ROLE_KEY não definida — operações de admin do Supabase recusadas.')

export const supabaseAdmin = createClient(url, key, {
  auth: { persistSession: false },
})
