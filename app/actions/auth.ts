"use server"

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { signPayload, verifyPayload } from '@/lib/session'

export async function loginWithPhone(phone: string, customerName?: string, storeId?: string) {
  if (!storeId) throw new Error('Tenant não identificado: storeId ausente no login')

  try {
    const formattedPhone = phone.replace(/\D/g, '')
    if (formattedPhone.length < 10) return { success: false, error: 'Número inválido' }

    let customer = await prisma.customer.findUnique({
      where: { storeId_phone: { storeId, phone: formattedPhone } }
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          storeId,
          phone: formattedPhone,
          name: customerName || 'Cliente ' + formattedPhone.slice(-4),
        }
      })
    }

    const cookieStore = await cookies()
    // 🔒 Cookie = "storeId|phone" assinado com HMAC — impede que o cliente forje sessão de outro tenant
    cookieStore.set(`session_token_${storeId}`, signPayload(`${storeId}|${formattedPhone}`), {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })

    return { success: true, user: customer }
  } catch (error) {
    console.error("[auth] Erro no login:", error instanceof Error ? error.message : 'Erro desconhecido')
    return { success: false, error: 'Erro ao entrar.' }
  }
}

export async function getSessionUser(storeId?: string) {
  if (!storeId) throw new Error('Tenant não identificado: storeId ausente em getSessionUser')

  const cookieStore = await cookies()
  const rawToken = cookieStore.get(`session_token_${storeId}`)?.value
  if (!rawToken) return null

  // 🔒 Verifica a assinatura HMAC — rejeita qualquer cookie forjado ou adulterado
  const payload = verifyPayload(rawToken)
  if (!payload) return null

  const parts = payload.split('|')
  if (parts.length !== 2) return null

  const [cookieStoreId, phone] = parts
  // 🔒 Verifica que a sessão pertence exatamente a este tenant
  if (cookieStoreId !== storeId) return null

  const customer = await prisma.customer.findUnique({
    where: { storeId_phone: { storeId, phone } },
    include: {
      addresses: {
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
      }
    }
  })
  return customer
}

type AddressData = {
  label: string
  cep: string
  rua: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
}

export async function saveAddress(data: AddressData, storeId?: string) {
  if (!storeId) throw new Error('Tenant não identificado: storeId ausente em saveAddress')

  try {
    const customer = await getSessionUser(storeId)
    if (!customer) return { success: false, error: 'Sessão expirada.' }

    const isFirst = customer.addresses.length === 0

    const address = await prisma.address.create({
      data: {
        customerId: customer.id,
        label: data.label,
        cep: data.cep.replace(/\D/g, ''),
        rua: data.rua,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        isDefault: isFirst,
      }
    })

    geocodeAddress(address.id, data).catch(console.error)

    return { success: true, address }
  } catch (error) {
    console.error("[auth] Erro ao salvar endereço:", error instanceof Error ? error.message : 'Erro desconhecido')
    return { success: false, error: 'Erro ao salvar endereço.' }
  }
}

async function geocodeAddress(addressId: string, data: AddressData) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!mapboxToken) return

  const fullAddress = `${data.rua}, ${data.numero}, ${data.bairro}, ${data.cidade}, ${data.estado}, Brasil`

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${mapboxToken}&limit=1`
    const res = await fetch(url)
    if (!res.ok) return

    const geoData = await res.json()
    if (geoData.features?.length > 0) {
      const [lng, lat] = geoData.features[0].center
      await prisma.address.update({ where: { id: addressId }, data: { lat, lng } })
    }
  } catch (err) {
    console.error("[auth] Geocoding falhou:", err instanceof Error ? err.message : 'Erro desconhecido')
  }
}

export async function logout(storeId: string) {
  const cookieStore = await cookies()
  cookieStore.delete(`session_token_${storeId}`)
}
