"use server"

import { cookies } from 'next/headers'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signPayload } from '@/lib/session'
import { SLUG_REGEX, RESERVED_SLUGS } from '@/lib/validation'

type RegisterInput = {
  ownerName: string
  email: string
  password: string
  storeName: string
  slug: string
  phone: string
}

type RegisterResult =
  | { success: true; slug: string }
  | { success: false; error: string }

export async function registerNewStore(data: RegisterInput): Promise<RegisterResult> {
  const { ownerName, email, password, storeName, slug, phone } = data

  // ── Validação de campos ───────────────────────────────────────────
  if (!ownerName?.trim() || !email?.trim() || !password || !storeName?.trim() || !slug?.trim() || !phone?.trim()) {
    return { success: false, error: 'Todos os campos são obrigatórios.' }
  }

  const normalizedSlug = slug.toLowerCase().trim()
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPhone = phone.trim().replace(/\D/g, '')

  if (normalizedSlug.length < 3 || normalizedSlug.length > 40) {
    return { success: false, error: 'O link deve ter entre 3 e 40 caracteres.' }
  }

  if (!SLUG_REGEX.test(normalizedSlug)) {
    return { success: false, error: 'O link deve conter apenas letras minúsculas, números e hifens.' }
  }

  if (RESERVED_SLUGS.has(normalizedSlug)) {
    return { success: false, error: 'Este endereço é reservado. Escolha outro.' }
  }

  if (password.length < 6) {
    return { success: false, error: 'A senha deve ter no mínimo 6 caracteres.' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { success: false, error: 'E-mail inválido.' }
  }

  if (normalizedPhone.length < 10) {
    return { success: false, error: 'Telefone inválido.' }
  }

  // ── Unicidade: slug e e-mail ──────────────────────────────────────
  const [existingSlug, existingEmail, existingPhone] = await Promise.all([
    prisma.store.findUnique({ where: { slug: normalizedSlug }, select: { id: true } }),
    prisma.user.findFirst({ where: { email: normalizedEmail }, select: { id: true } }),
    prisma.user.findFirst({ where: { phone: normalizedPhone }, select: { id: true } }),
  ])

  if (existingSlug) {
    return { success: false, error: 'Este endereço já está em uso. Escolha outro.' }
  }

  if (existingEmail) {
    return { success: false, error: 'Este e-mail já possui uma conta.' }
  }

  if (existingPhone) {
    return { success: false, error: 'Este telefone já está cadastrado.' }
  }

  // ── Hash da senha (custo 12) ──────────────────────────────────────
  const passwordHash = await hash(password, 12)

  // ── Transação atômica: Store + User ──────────────────────────────
  let store: { id: string; slug: string }
  let user: { id: string }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newStore = await tx.store.create({
        data: {
          slug: normalizedSlug,
          name: storeName.trim(),
          phone: normalizedPhone,
        },
        select: { id: true, slug: true }
      })

      const newUser = await tx.user.create({
        data: {
          storeId: newStore.id,
          name: ownerName.trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
          password: passwordHash,
          role: 'ADMIN',
        },
        select: { id: true }
      })

      return { store: newStore, user: newUser }
    })

    store = result.store
    user = result.user
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return { success: false, error: 'Slug ou e-mail já cadastrado. Tente outro.' }
    }
    console.error('[registerNewStore]', error)
    return { success: false, error: 'Erro interno. Tente novamente.' }
  }

  // ── Auto-login: assina cookie lojista_token ───────────────────────
  const cookieStore = await cookies()
  cookieStore.set(`lojista_token_${store.id}`, signPayload(`${user.id}|${store.id}|ADMIN`), {
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  })

  return { success: true, slug: store.slug }
}
