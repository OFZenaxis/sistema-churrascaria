"use client"

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side only — usa anon key (RLS do bucket controla acesso)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const BUCKET = 'saiu-media'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export async function uploadImage(file: File, storeId: string): Promise<string> {
  if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
    throw new Error(
      `Tipo de arquivo não permitido: "${file.type}". Apenas JPEG, PNG e WebP são aceitos.`
    )
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${storeId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
