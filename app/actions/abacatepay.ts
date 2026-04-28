'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAdminSession } from '@/app/actions/adminAuth'
import { logger } from '@/lib/logger'

// Tipos baseados no envelope da AbacatePay: { data: T, success: boolean, error: string | null }
type AbacateSubData = {
  id: string
  amount?: number
  nextChargeAt?: string
  status?: string
}

export type AbacateCheckout = {
  id: string
  createdAt: string
  amount: number
  paidAmount?: number
  status: string
  receiptUrl?: string
  metadata?: Record<string, string>
  customer?: { metadata?: Record<string, string> }
}

// Retorna os dados da assinatura ativa da loja
export async function getSubscriptionData(storeId: string) {
  const session = await requireAdminSession(storeId)
  if (!session) return { error: 'Não autorizado' }

  const apiKey = process.env.ABACATEPAY_API_KEY
  if (!apiKey) return { error: 'API Key não configurada' }

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { abacatepaySubscriptionId: true }
  })

  if (!store?.abacatepaySubscriptionId) {
    return { error: 'Assinatura não registrada no banco de dados' }
  }

  const subId = store.abacatepaySubscriptionId

  try {
    // Tentativa 1: GET /subscriptions/list e filtra pelo ID local
    const listRes = await fetch('https://api.abacatepay.com/v2/subscriptions/list', {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store'
    })
    const listData = await listRes.json() as { success: boolean; data: AbacateSubData[] }

    if (listData.success && Array.isArray(listData.data)) {
      const found = listData.data.find((s) => s.id === subId)
      if (found) return { success: true, data: found }
    }

    return { error: 'Assinatura não encontrada na AbacatePay' }
  } catch (err) {
    logger.error('abacatepay', 'getSubscriptionData: erro de comunicação com o gateway', err)
    return { error: 'Erro de comunicação com o gateway' }
  }
}

// Retorna o histórico de faturas/checkouts da loja filtrado pelo storeId no metadata
export async function getSubscriptionHistory(storeId: string) {
  const session = await requireAdminSession(storeId)
  if (!session) return { success: true, history: [] as AbacateCheckout[] }

  const apiKey = process.env.ABACATEPAY_API_KEY
  if (!apiKey) return { success: true, history: [] as AbacateCheckout[] }

  try {
    const res = await fetch('https://api.abacatepay.com/v2/checkouts/list', {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store'
    })
    const data = await res.json() as { success: boolean; data: AbacateCheckout[] }

    if (data.success && Array.isArray(data.data)) {
      // Filtra pelos checkouts cujo metadata.storeId pertence a este tenant
      const history = data.data.filter((c) => c.metadata?.storeId === storeId)
      return { success: true, history }
    }
    return { success: true, history: [] as AbacateCheckout[] }
  } catch {
    return { success: true, history: [] as AbacateCheckout[] }
  }
}

// Cancela a assinatura via POST /subscriptions/cancel
export async function cancelSubscription(storeId: string) {
  // 🔒 BUG-AUDIT: verifica sessão antes de qualquer operação — impede IDOR via Client Component
  const session = await requireAdminSession(storeId)
  if (!session) return { success: false, error: 'Não autorizado' }

  const apiKey = process.env.ABACATEPAY_API_KEY
  if (!apiKey) return { success: false, error: 'API Key não configurada' }

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { abacatepaySubscriptionId: true, slug: true }
  })

  if (!store?.abacatepaySubscriptionId) {
    return { success: false, error: 'Assinatura não localizada' }
  }

  const subId = store.abacatepaySubscriptionId

  try {
    const res = await fetch('https://api.abacatepay.com/v2/subscriptions/cancel', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: subId })
    })

    const data = await res.json() as { success: boolean; error?: string }

    if (!res.ok || !data.success) {
      logger.error('abacatepay', `cancelSubscription: falha na AbacatePay para storeId=${storeId}`)
      return { success: false, error: data.error || 'Falha ao cancelar na AbacatePay' }
    }

    // API confirmou cancelamento — atualiza status local atomicamente
    await prisma.store.update({
      where: { id: storeId },
      data: { subscriptionStatus: 'CANCELED' }
    })

    revalidatePath(`/${store.slug}/admin/assinatura`)

    return { success: true }
  } catch (err) {
    logger.error('abacatepay', 'cancelSubscription: erro de rede', err)
    return { success: false, error: 'Erro de rede ao cancelar assinatura' }
  }
}
