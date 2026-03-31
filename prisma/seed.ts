import { PrismaClient, ProductType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clean existing data
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.deliveryZone.deleteMany()

  // 1. Delivery Zones
  const zoneCenter = await prisma.deliveryZone.create({
    data: { name: 'Centro', fee: 8.5 }
  })
  const zoneSouth = await prisma.deliveryZone.create({
    data: { name: 'Zona Sul', fee: 12.0 }
  })
  
  // 2. Categories (Adaptado para Stories)
  const catMarmitas = await prisma.category.create({
    data: { name: 'Marmitas' }
  })
  const catBebidas = await prisma.category.create({
    data: { name: 'Bebidas' }
  })
  const catAdicionais = await prisma.category.create({
    data: { name: 'Adicionais' }
  })

  // 3. Adicionais (Upsells)
  await prisma.product.createMany({
    data: [
      { name: 'Linguiça Toscana (Un.)', price: 4.0, type: ProductType.SIDE, categoryId: catAdicionais.id },
      { name: 'Ovo Frito', price: 3.0, type: ProductType.SIDE, categoryId: catAdicionais.id },
      { name: 'Porção Extra de Carne Assada', price: 10.0, type: ProductType.SIDE, categoryId: catAdicionais.id },
      { name: 'Mandioca Extra', price: 6.0, type: ProductType.SIDE, categoryId: catAdicionais.id },
      { name: 'Coca-Cola 2L', price: 14.0, type: ProductType.BEVERAGE, categoryId: catBebidas.id },
      { name: 'Guaraná Antarctica 2L', price: 12.0, type: ProductType.BEVERAGE, categoryId: catBebidas.id },
      { name: 'Coca-Cola Lata', price: 6.0, type: ProductType.BEVERAGE, categoryId: catBebidas.id },
    ]
  })

  // 4. Marmitas (Marmita-First)
  // Tipo COMBO para disparar a abertura do novo <ProductModal /> (Marmita Builder)
  await prisma.product.createMany({
    data: [
      { 
        name: 'Marmita Churrasco G', 
        price: 36.0, 
        type: ProductType.COMBO, 
        categoryId: catMarmitas.id, 
        description: 'A pioneira do Jardim Ingá. Acompanha arroz, feijão tropeiro, mandioca e o mix de churrasco da casa (Carne Assada, Frango, Linguiça).',
      },
      { 
        name: 'Marmita Churrasco M', 
        price: 28.0, 
        type: ProductType.COMBO, 
        categoryId: catMarmitas.id, 
        description: 'A pioneira do Jardim Ingá. Acompanha arroz, feijão tropeiro, mandioca e o mix de churrasco da casa.',
      },
      { 
        name: 'Marmita Econômica', 
        price: 19.9, 
        type: ProductType.COMBO, 
        categoryId: catMarmitas.id, 
        description: 'No precinho! Acompanha arroz, feijão tropeiro, mandioca e o mix de churrasco da casa.',
      }
    ]
  })

  console.log('✅ Seed finished successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
