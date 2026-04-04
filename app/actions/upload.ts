"use server"

import { supabaseAdmin } from '@/lib/supabase'
import { getLojistaSession } from './adminAuth'

const BUCKET = 'saiu-media'

export async function uploadCoverImage(
  formData: FormData
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  const session = await getLojistaSession()
  if (!session) return { success: false, error: 'Não autorizado.' }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { success: false, error: 'Nenhum arquivo recebido.' }

  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'O arquivo deve ser uma imagem.' }
  }

  const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
  if (file.size > MAX_BYTES) {
    return { success: false, error: 'A imagem deve ter no máximo 5 MB.' }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `covers/cover-${session.storeId}-${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('[uploadCoverImage]', error.message)
    return { success: false, error: `Erro no upload: ${error.message}` }
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
  return { success: true, url: data.publicUrl }
}
