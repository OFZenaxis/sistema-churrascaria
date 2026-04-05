"use server"

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'
import { logger } from '@/lib/logger'
import { getLojistaSession, requireAdminSession } from '@/app/actions/adminAuth'

export async function toggleProductActive(productId: string, currentStatus: boolean, storeId: string) {
  if (!storeId) throw new Error('Tenant não identificado')

  try {
    // 🔒 storeId obrigatório no where — impede mutação em produto de outro tenant
    const updated = await prisma.product.update({
      where: { id: productId, storeId },
      data: { isActive: !currentStatus }
    })
    return { success: true, isActive: updated.isActive }
  } catch (error) {
    logger.error('admin', 'Erro toggleProductActive: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), error)
    return { success: false, error: 'Erro na conexão com o banco ao alterar produto.' }
  }
}

export async function saveProduct(data: {
  id?: string,
  name: string,
  price: number,
  description: string,
  imageUrl: string,
  categoryId: string,
  storeId: string // 🔒 Obrigatório — sem fallback
}) {
  if (!data.storeId) throw new Error('Tenant não identificado')
  if (!data.categoryId) return { success: false, error: 'Categoria é obrigatória.' }

  try {
    if (data.id) {
      // 🔒 storeId no where garante que só atualiza produtos do próprio tenant
      await prisma.product.update({
        where: { id: data.id, storeId: data.storeId },
        data: {
          name: data.name,
          price: data.price,
          description: data.description,
          imageUrl: data.imageUrl,
          categoryId: data.categoryId,
        }
      })
    } else {
      await prisma.product.create({
        data: {
          name: data.name,
          price: data.price,
          description: data.description,
          imageUrl: data.imageUrl,
          categoryId: data.categoryId,
          storeId: data.storeId,
          isActive: true
        }
      })
    }
    return { success: true }
  } catch (error) {
    logger.error('admin', 'Erro no saveProduct: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), error)
    return { success: false, error: 'Erro ao salvar produto no banco.' }
  }
}

export async function toggleStoreStatus(currentStatus: boolean, storeId: string) {
  if (!storeId) throw new Error('Tenant não identificado')

  try {
    // 🔒 storeId obrigatório — admin só pode operar sua própria loja
    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: { isOpen: !currentStatus }
    })
    return { success: true, isOpen: updatedStore.isOpen }
  } catch (error) {
    logger.error('admin', 'Erro toggleStoreStatus: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), error)
    return { success: false, error: 'Erro ao alterar status da loja.' }
  }
}

export async function saveStoreSettings(
  data: {
    name: string
    tagline?: string
    city?: string
    phone?: string
    logoUrl?: string
    coverImageUrl?: string
    kitchenPin?: string
    slug: string // necessário para revalidar a vitrine
  },
  storeId: string
) {
  if (!storeId) throw new Error('Tenant não identificado')

  // 🔒 Valida que a sessão ativa pertence a este tenant (O-03)
  if (!await requireAdminSession(storeId)) return { success: false, error: 'Não autorizado.' }

  if (!data.name?.trim()) {
    return { success: false, error: 'O nome da loja é obrigatório.' }
  }

  // Valida e resolve o novo PIN:
  // '******' → lojista não alterou (mantém o atual no banco)
  // ''       → remover o PIN (null)
  // dígitos  → novo PIN (4–6 dígitos)
  const rawPin = data.kitchenPin?.trim() ?? ''
  const pinUnchanged = rawPin === '******'
  if (!pinUnchanged && rawPin !== '' && !/^\d{4,6}$/.test(rawPin)) {
    return { success: false, error: 'O PIN da cozinha deve ter entre 4 e 6 dígitos numéricos.' }
  }

  try {
    await prisma.store.update({
      where: { id: storeId },
      data: {
        name: data.name.trim(),
        tagline: data.tagline?.trim() || null,
        city: data.city?.trim() || null,
        phone: data.phone?.trim() || null,
        logoUrl: data.logoUrl?.trim() || null,
        coverImageUrl: data.coverImageUrl?.trim() || null,
        // Só toca no PIN se o lojista enviou algo novo — '******' = sem alteração
        ...(!pinUnchanged && { kitchenPin: rawPin || null }),
      }
    })

    // Invalida o cache da vitrine pública para refletir o novo branding imediatamente
    revalidatePath(`/${data.slug}`)

    return { success: true }
  } catch (error) {
    logger.error('admin', 'Erro saveStoreSettings: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), error)
    return { success: false, error: 'Erro ao salvar configurações.' }
  }
}

export async function createCategory(name: string, storeId: string) {
  if (!storeId) throw new Error('Tenant não identificado')
  if (!name?.trim()) return { success: false, error: 'Nome é obrigatório.' }

  if (!await requireAdminSession(storeId)) return { success: false, error: 'Não autorizado.' }

  try {
    const category = await prisma.category.create({
      data: { name: name.trim(), storeId },
      select: { id: true, name: true }
    })
    return { success: true, category }
  } catch (error) {
    logger.error('admin', 'Erro createCategory: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), error)
    return { success: false, error: 'Erro ao criar categoria.' }
  }
}

export async function deleteCategory(id: string, storeId: string) {
  if (!storeId) throw new Error('Tenant não identificado')

  if (!await requireAdminSession(storeId)) return { success: false, error: 'Não autorizado.' }

  try {
    // 🔒 Valida que a categoria pertence ao tenant antes de deletar
    const productCount = await prisma.product.count({ where: { categoryId: id, storeId } })
    if (productCount > 0) {
      return {
        success: false,
        error: `Esta categoria tem ${productCount} produto(s). Mova-os para outra categoria antes de deletar.`
      }
    }

    await prisma.category.deleteMany({ where: { id, storeId } })
    return { success: true }
  } catch (error) {
    logger.error('admin', 'Erro deleteCategory: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), error)
    return { success: false, error: 'Erro ao deletar categoria.' }
  }
}

// ── Delivery Settings (GPS Dinâmico) ─────────────────────────────────────────

export async function saveDeliverySettings(
  data: {
    storeAddress: string
    baseDeliveryFee: number
    deliveryFeePerKm: number
    maxDeliveryRadius: number
  },
  storeId: string
): Promise<{
  success: boolean
  error?: string
  coords?: { lat: number; lng: number }
  geocodeWarning?: string
}> {
  if (!storeId) throw new Error('Tenant não identificado')

  if (!await requireAdminSession(storeId)) return { success: false, error: 'Não autorizado.' }

  if (data.baseDeliveryFee < 0 || data.deliveryFeePerKm < 0) {
    return { success: false, error: 'Valores de taxa não podem ser negativos.' }
  }
  if (data.maxDeliveryRadius <= 0) {
    return { success: false, error: 'O raio máximo deve ser maior que zero.' }
  }

  // Geocodifica o endereço server-side para obter lat/lng atualizados
  let coords: { lat: number; lng: number } | null = null
  let geocodeWarning: string | undefined

  if (data.storeAddress.trim()) {
    const { geocodeAddress } = await import('@/lib/mapbox')
    coords = await geocodeAddress(data.storeAddress.trim())
    // BUG-007: rejeita (0,0) — resposta silenciosa de falha do Mapbox aponta para o oceano
    if (coords && Math.abs(coords.lat) < 0.001 && Math.abs(coords.lng) < 0.001) {
      coords = null
    }
    if (!coords) {
      geocodeWarning = 'Endereço não encontrado no Mapbox. As configurações foram salvas, mas o raio de entrega não funcionará até que o endereço seja corrigido.'
    }
  } else {
    geocodeWarning = 'Endereço da loja não informado. O cálculo de distância não funcionará.'
  }

  try {
    await prisma.store.update({
      where: { id: storeId },
      data: {
        storeAddress: data.storeAddress.trim() || null,
        baseDeliveryFee: data.baseDeliveryFee,
        deliveryFeePerKm: data.deliveryFeePerKm,
        maxDeliveryRadius: data.maxDeliveryRadius,
        ...(coords && { storeLat: coords.lat, storeLng: coords.lng }),
      }
    })

    return { success: true, ...(coords && { coords }), ...(geocodeWarning && { geocodeWarning }) }
  } catch (error) {
    logger.error('admin', 'Erro saveDeliverySettings: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), error)
    return { success: false, error: 'Erro ao salvar configurações de entrega.' }
  }
}

// ── Delivery Zones (legado — mantido para compatibilidade) ────────────────────

export async function saveDeliveryZone(
  data: {
    id?: string
    name: string
    fee: number
    estimatedTime?: string
    isActive?: boolean
  },
  storeId: string
) {
  if (!storeId) throw new Error('Tenant não identificado')
  if (!data.name?.trim()) return { success: false, error: 'Nome da zona é obrigatório.' }
  if (data.fee < 0) return { success: false, error: 'A taxa não pode ser negativa.' }

  if (!await requireAdminSession(storeId)) return { success: false, error: 'Não autorizado.' }

  try {
    if (data.id) {
      await prisma.deliveryZone.update({
        where: { id: data.id, storeId },
        data: {
          name: data.name.trim(),
          fee: data.fee,
          estimatedTime: data.estimatedTime?.trim() || null,
        }
      })
    } else {
      await prisma.deliveryZone.create({
        data: {
          name: data.name.trim(),
          fee: data.fee,
          estimatedTime: data.estimatedTime?.trim() || null,
          isActive: true,
          storeId,
        }
      })
    }
    return { success: true }
  } catch (error) {
    logger.error('admin', 'Erro saveDeliveryZone: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), error)
    return { success: false, error: 'Erro ao salvar zona de entrega.' }
  }
}

export async function deleteDeliveryZone(id: string, storeId: string) {
  if (!storeId) throw new Error('Tenant não identificado')

  if (!await requireAdminSession(storeId)) return { success: false, error: 'Não autorizado.' }

  try {
    await prisma.deliveryZone.deleteMany({ where: { id, storeId } })
    return { success: true }
  } catch (error) {
    logger.error('admin', 'Erro deleteDeliveryZone: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), error)
    return { success: false, error: 'Erro ao excluir zona de entrega.' }
  }
}

export async function toggleDeliveryZoneActive(id: string, storeId: string, currentStatus: boolean) {
  if (!storeId) throw new Error('Tenant não identificado')

  try {
    await prisma.deliveryZone.update({
      where: { id, storeId },
      data: { isActive: !currentStatus }
    })
    return { success: true }
  } catch (error) {
    logger.error('admin', 'Erro toggleDeliveryZoneActive: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), error)
    return { success: false, error: 'Erro ao alterar zona.' }
  }
}

export async function getStoreSettings(storeId: string) {
  if (!storeId) throw new Error('Tenant não identificado')

  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId }
    })
    return store ? { id: store.id, isOpen: store.isOpen } : null
  } catch {
    return null
  }
}

// ── KDS Actions ───────────────────────────────────────────────────────────────

/**
 * Busca pedidos ativos do dia para o KDS (PENDING, PREPARING, READY_FOR_PICKUP).
 * Autenticado pela sessão lojista_token — não requer storeId explícito.
 */
export async function fetchKdsOrders() {
  const session = await getLojistaSession()
  if (!session) return { success: false as const, error: 'Não autorizado.', orders: [], isOpen: false }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    const [orders, store] = await Promise.all([
      prisma.order.findMany({
        where: {
          storeId: session.storeId,
          status: { in: ['PENDING', 'PREPARING', 'READY_FOR_PICKUP'] },
          createdAt: { gte: today },
        },
        include: {
          items: {
            include: { product: { select: { name: true } } }
          }
        },
        orderBy: { createdAt: 'asc' },
        take: 100, // BUG-013: previne timeout em lojas de alto volume
      }),
      prisma.store.findUnique({
        where: { id: session.storeId },
        select: { isOpen: true },
      }),
    ])

    return { success: true as const, orders, isOpen: store?.isOpen ?? true }
  } catch (error) {
    logger.error('admin', 'fetchKdsOrders: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), error)
    return { success: false as const, error: 'Erro ao buscar pedidos.', orders: [], isOpen: false }
  }
}

const VALID_KDS_STATUSES = ['PENDING', 'PREPARING', 'READY_FOR_PICKUP', 'DISPATCHED', 'DELIVERED', 'CANCELED'] as const

/** Type guard: garante que a string é um OrderStatus válido antes de persistir. */
function isValidOrderStatus(s: string): s is OrderStatus {
  return (VALID_KDS_STATUSES as readonly string[]).includes(s)
}

/**
 * Atualiza o status de um pedido.
 * 🔒 storeId vem da sessão — impossível cruzar tenants.
 */
export async function updateOrderStatus(orderId: string, newStatus: string) {
  const session = await getLojistaSession()
  if (!session) return { success: false, error: 'Não autorizado.' }

  if (!isValidOrderStatus(newStatus)) {
    return { success: false, error: 'Status inválido.' }
  }

  try {
    await prisma.order.update({
      where: { id: orderId, storeId: session.storeId }, // 🔒 tenant isolation
      data: { status: newStatus },
    })
    return { success: true }
  } catch (error) {
    logger.error('admin', 'updateOrderStatus: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), error)
    return { success: false, error: 'Erro ao atualizar status.' }
  }
}

/**
 * Alterna o status de abertura da loja (isOpen) para o tenant autenticado.
 * Retorna o novo estado após a atualização.
 */
export async function toggleKdsStoreStatus() {
  const session = await getLojistaSession()
  if (!session) return { success: false, error: 'Não autorizado.', isOpen: false }

  try {
    const store = await prisma.store.findUnique({
      where: { id: session.storeId },
      select: { isOpen: true },
    })
    if (!store) return { success: false, error: 'Loja não encontrada.', isOpen: false }

    const updated = await prisma.store.update({
      where: { id: session.storeId },
      data: { isOpen: !store.isOpen },
      select: { isOpen: true },
    })
    return { success: true, isOpen: updated.isOpen }
  } catch (error) {
    logger.error('admin', 'toggleKdsStoreStatus: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), error)
    return { success: false, error: 'Erro ao alterar status da loja.', isOpen: false }
  }
}

export async function updateStoreTheme(data: {
  brandColor: string
  themeId: string
  coverImageUrl?: string
}) {
  const session = await getLojistaSession()
  if (!session) return { success: false, error: 'Não autorizado.' }

  const color = data.brandColor.trim()
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    return { success: false, error: 'Cor inválida. Use formato hexadecimal (ex: #ff5500).' }
  }

  const validThemeIds = ['classic-light', 'tokyo-dark', 'napoli-warm', 'tropical-fresh', 'brazil-bbq', 'cafe-premium']
  if (!validThemeIds.includes(data.themeId)) {
    return { success: false, error: 'Tema inválido.' }
  }

  try {
    const store = await prisma.store.update({
      where: { id: session.storeId },
      data: {
        brandColor: color,
        themeId: data.themeId,
        coverImageUrl: data.coverImageUrl?.trim() || null,
      },
      select: { slug: true },
    })
    revalidatePath(`/${store.slug}`)
    return { success: true }
  } catch (error) {
    logger.error('admin', 'updateStoreTheme: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), error)
    return { success: false, error: 'Erro ao salvar aparência.' }
  }
}
