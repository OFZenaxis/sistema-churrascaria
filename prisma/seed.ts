import { PrismaClient, ProductType, SubscriptionTier, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando Seed (Multi-Tenant SaaS)...')

  // ══════════════════════════════════════════════════════════════════
  // LÍMPEZA DE DADOS (CASCATA REVERSA)
  // ══════════════════════════════════════════════════════════════════
  console.log('🧹 Limpando dados antigos...')
  await prisma.orderItem.deleteMany()
  await prisma.delivery.deleteMany()
  await prisma.order.deleteMany()
  await prisma.address.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.user.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.deliveryZone.deleteMany()
  await prisma.storePaymentConfig.deleteMany()
  await prisma.store.deleteMany()

  // ══════════════════════════════════════════════════════════════════
  // CRIAÇÃO DO TENANT ZERO (LOJA 001)
  // ══════════════════════════════════════════════════════════════════
  console.log('🏢 Criando Master Store 001...')
  const storeZero = await prisma.store.create({
    data: {
      slug: 'costa-e-souza',
      customDomain: 'churrascariacostaesouza.com.br',
      name: 'Churrascaria Costa & Souza',
      document: '00.000.000/0001-00',
      tier: SubscriptionTier.ENTERPRISE,
      isActive: true,
      features: { "kds": true, "gamification": false, "upsell": true },
      isOpen: true
    }
  })

  // ══════════════════════════════════════════════════════════════════
  // CONFIGURAÇÃO FINANCEIRA
  // ══════════════════════════════════════════════════════════════════
  console.log('💳 Configurando Gateway de Pagamento (Mercado Pago)...')
  await prisma.storePaymentConfig.create({
    data: {
      storeId: storeZero.id,
      mpAccessToken: 'APP_USR-token-ficticio-por-enquanto',
      mpPublicKey: 'APP_USR-public-token-ficticio',
      pixDiscountPercent: 5.0
    }
  })

  // ══════════════════════════════════════════════════════════════════
  // ACESSO ADMIN
  // ══════════════════════════════════════════════════════════════════
  console.log('👨‍💻 Criando Conta Administrativa (Backoffice)...')
  await prisma.user.create({
    data: {
      storeId: storeZero.id,
      name: 'Super Admin',
      phone: '11999999999',
      email: 'admin@costaesouza.com.br',
      password: 'senha_criptografada_futura', // O ideal é hash, mas para seed simplificado tá valendo
      role: Role.SUPER_ADMIN
    }
  })

  // ══════════════════════════════════════════════════════════════════
  // CATÁLOGO ISOLADO DA LOJA 001
  // ══════════════════════════════════════════════════════════════════
  console.log('🥩 Populando Catálogo Exclusivo do Tenant...')
  
  // Zonas de Entrega
  const zoneCenter = await prisma.deliveryZone.create({
    data: { name: 'Centro Luziânia', fee: 8.5, storeId: storeZero.id }
  })
  
  // Categorias
  const catMarmitas = await prisma.category.create({
    data: { name: 'Marmitas', storeId: storeZero.id }
  })
  const catBebidas = await prisma.category.create({
    data: { name: 'Bebidas', storeId: storeZero.id }
  })

  // Produtos
  await prisma.product.createMany({
    data: [
      { 
        name: 'Marmita Churrasco G', 
        price: 38.0, 
        type: ProductType.COMBO, 
        categoryId: catMarmitas.id, 
        storeId: storeZero.id,
        description: 'A pioneira do Jardim Ingá. Acompanha arroz, tropeiro, mandioca e mix na brasa.',
        isActive: true
      },
      { 
        name: 'Marmita Econômica', 
        price: 20.0, 
        type: ProductType.COMBO, 
        categoryId: catMarmitas.id, 
        storeId: storeZero.id,
        description: 'No precinho! Acompanha arroz, feijão tropeiro e churrasco.',
        isActive: true
      },
      { 
        name: 'Coca-Cola 2L', 
        price: 15.0, 
        type: ProductType.BEVERAGE, 
        categoryId: catBebidas.id,
        storeId: storeZero.id,
        isActive: true
      },
      { 
        name: 'Guaraná Lata', 
        price: 6.0, 
        type: ProductType.BEVERAGE, 
        categoryId: catBebidas.id,
        storeId: storeZero.id,
        isActive: true
      },
    ]
  })

  console.log('🚀 Seed da Loja base finalizado com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro Crítico no Seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
