import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// Slug: apenas letras minúsculas, números e hifens. Mínimo 3, máximo 40 chars.
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Slugs que conflitam com rotas da plataforma — nunca podem ser usados por lojistas
const RESERVED_SLUGS = new Set([
  'admin', 'api', 'login', 'logout', 'cadastro', 'pricing',
  'about', 'contato', 'suporte', 'saiu', 'saiudelivery',
  'app', 'dashboard', 'billing', 'webhook', 'static',
])

type CreateTenantBody = {
  name: string    // Nome do restaurante
  slug: string    // Identificador único (vira a URL)
  email: string   // E-mail do lojista (login)
  password: string
  phone: string   // Telefone do lojista
}

export async function POST(req: Request) {
  try {
    const body: CreateTenantBody = await req.json()
    const { name, slug, email, password, phone } = body

    // ── Validação de campos obrigatórios ──────────────────────────
    if (!name?.trim() || !slug?.trim() || !email?.trim() || !password || !phone?.trim()) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios.' },
        { status: 400 }
      )
    }

    // ── Validação de formato do slug ──────────────────────────────
    const normalizedSlug = slug.toLowerCase().trim()

    if (normalizedSlug.length < 3 || normalizedSlug.length > 40) {
      return NextResponse.json(
        { error: 'O slug deve ter entre 3 e 40 caracteres.' },
        { status: 400 }
      )
    }

    if (!SLUG_REGEX.test(normalizedSlug)) {
      return NextResponse.json(
        { error: 'O slug deve conter apenas letras minúsculas, números e hifens (ex: minha-pizzaria).' },
        { status: 400 }
      )
    }

    // 🔒 Bloqueia slugs reservados — evita colisão com rotas da plataforma
    if (RESERVED_SLUGS.has(normalizedSlug)) {
      return NextResponse.json(
        { error: 'Este endereço é reservado. Escolha outro (ex: minha-pizzaria).' },
        { status: 400 }
      )
    }

    // ── Validação de senha mínima ─────────────────────────────────
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 8 caracteres.' },
        { status: 400 }
      )
    }

    // ── Validação de e-mail básico ────────────────────────────────
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'E-mail inválido.' },
        { status: 400 }
      )
    }

    // ── Unicidade: slug e e-mail ──────────────────────────────────
    const [existingSlug, existingEmail] = await Promise.all([
      prisma.store.findUnique({ where: { slug: normalizedSlug }, select: { id: true } }),
      prisma.user.findUnique({ where: { email }, select: { id: true } }),
    ])

    if (existingSlug) {
      return NextResponse.json(
        { error: 'Este endereço já está em uso. Escolha outro.' },
        { status: 400 }
      )
    }

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Este e-mail já possui uma conta.' },
        { status: 400 }
      )
    }

    // ── Hash da senha (custo 12 — bom balanço segurança/performance) ──
    const passwordHash = await hash(password, 12)

    // ── Transação atômica: Store + User criados juntos ou nenhum ──
    const { store, user } = await prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          slug: normalizedSlug,
          name: name.trim(),
          phone: phone.trim(),
          // isActive: false  ← descomente quando billing estiver ativo
          // tier: 'BASIC'   ← default já definido no schema
        },
        select: { id: true, slug: true, name: true }
      })

      const user = await tx.user.create({
        data: {
          storeId: store.id,
          name: name.trim(),       // nome do restaurante como nome inicial do dono
          email,
          phone: phone.trim().replace(/\D/g, ''),
          password: passwordHash,
          role: 'ADMIN',
        },
        select: { id: true, email: true }
      })

      return { store, user }
    })

    return NextResponse.json(
      {
        message: 'Loja criada com sucesso!',
        storeId: store.id,
        slug: store.slug,
        adminUrl: `/${store.slug}/admin`,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    // Prisma unique constraint race condition (dois cadastros simultâneos do mesmo slug)
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Slug ou e-mail já cadastrado. Tente outro.' },
        { status: 409 }
      )
    }

    console.error('[POST /api/tenant]', error)
    return NextResponse.json(
      { error: 'Erro interno. Tente novamente.' },
      { status: 500 }
    )
  }
}
