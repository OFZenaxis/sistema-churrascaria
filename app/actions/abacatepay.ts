'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Retorna os dados da assinatura (se achar o endpoint)
export async function getSubscriptionData(storeId: string) {
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
    // Tentativa 1: Endpoint provável GET /subscriptions/{id}
    const res = await fetch(`https://api.abacatepay.com/v2/subscriptions/${subId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store'
    })
    
    if (res.ok) {
      const data = await res.json()
      if (data.success) {
        return { success: true, data: data.data }
      }
    }

    // Tentativa 2: Fallback para GET /subscriptions/list
    const listRes = await fetch(`https://api.abacatepay.com/v2/subscriptions/list`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store'
    })
    const listData = await listRes.json()
    
    if (listData.success && Array.isArray(listData.data)) {
      const found = listData.data.find((s: any) => s.id === subId || s.id === subId)
      if (found) {
        return { success: true, data: found }
      }
    }
    
    return { error: 'Assinatura não encontrada na AbacatePay' }
  } catch (err) {
    console.error('[getSubscriptionData]', err)
    return { error: 'Erro de comunicação com o gateway' }
  }
}

// Retorna o histórico de faturas/checkouts da loja
export async function getSubscriptionHistory(storeId: string) {
  const apiKey = process.env.ABACATEPAY_API_KEY
  if (!apiKey) return { success: true, history: [] }

  try {
    // Lista os checkouts
    const res = await fetch('https://api.abacatepay.com/v2/checkouts/list', {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store'
    })
    const data = await res.json()
    if (data.success && Array.isArray(data.data)) {
      // Filtramos pelos checkouts que pertencem a este lojista
      const history = data.data.filter((c: any) => c.metadata?.storeId === storeId || c.customer?.metadata?.storeId === storeId)
      return { success: true, history }
    }
    return { success: true, history: [] }
  } catch {
    return { success: true, history: [] }
  }
}

// Cancela a assinatura via POST /subscriptions/cancel
export async function cancelSubscription(storeId: string) {
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
      // Passando as variantes de ID comuns em REST APIs para garantir o cancelamento
      body: JSON.stringify({ id: subId, subscriptionId: subId }) 
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      console.error('[cancelSubscription] Falha na AbacatePay:', data)
      return { success: false, error: data.error || 'Falha ao cancelar na AbacatePay' }
    }

    // Se a API retornou sucesso, atualizamos localmente de imediato
    await prisma.store.update({
      where: { id: storeId },
      data: { subscriptionStatus: 'CANCELED' }
    })

    // Revalida a página
    revalidatePath(`/admin/assinatura`)

    return { success: true }
  } catch (err) {
    console.error('[cancelSubscription]', err)
    return { success: false, error: 'Erro de rede' }
  }
}
