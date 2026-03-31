"use server"

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

// ===== LOGIN =====
export async function loginWithPhone(phone: string, customerName?: string) {
  try {
    const formattedPhone = phone.replace(/\D/g, '')
    if (formattedPhone.length < 10) return { success: false, error: 'Número inválido' }

    // Pega ou cria o usuário baseado no telefone
    let user = await prisma.user.findUnique({ where: { phone: formattedPhone } })

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: formattedPhone,
          name: customerName || 'Cliente ' + formattedPhone.slice(-4),
        }
      })
    }

    // Salva nos cookies por 30 dias
    const cookieStore = await cookies()
    cookieStore.set('session_phone', formattedPhone, {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    })

    return { success: true, user }
  } catch (error) {
    console.error("Erro no login", error)
    return { success: false, error: 'Erro ao entrar.' }
  }
}

// ===== GET SESSION USER (com endereços) =====
export async function getSessionUser() {
  const cookieStore = await cookies()
  const phone = cookieStore.get('session_phone')?.value

  if (!phone) return null

  const user = await prisma.user.findUnique({
    where: { phone },
    include: {
      addresses: {
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' }
        ]
      }
    }
  })
  return user
}

// ===== SAVE ADDRESS =====
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

export async function saveAddress(data: AddressData) {
  try {
    const user = await getSessionUser()
    if (!user) return { success: false, error: 'Não autenticado.' }

    // Se é o primeiro endereço, marca como default
    const isFirst = user.addresses.length === 0

    const address = await prisma.address.create({
      data: {
        userId: user.id,
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

    // Geocodifica em background (não bloqueia)
    geocodeAddress(address.id, data).catch(console.error)

    return { success: true, address }
  } catch (error) {
    console.error("Erro ao salvar endereço", error)
    return { success: false, error: 'Erro ao salvar endereço.' }
  }
}

// Geocodifica e salva lat/lng no Address (cache)
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
      await prisma.address.update({
        where: { id: addressId },
        data: { lat, lng }
      })
    }
  } catch (err) {
    console.error("Geocoding do endereço falhou", err)
  }
}

// ===== LOGOUT =====
export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('session_phone')
}
