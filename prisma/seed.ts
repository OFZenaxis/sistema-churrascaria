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
  
  // 2. Categories
  const catCuts = await prisma.category.create({
    data: { name: 'Cortes Especiais' }
  })
  const catSides = await prisma.category.create({
    data: { name: 'Acompanhamentos' }
  })
  const catCombos = await prisma.category.create({
    data: { name: 'Combos' }
  })

  // 3. Sides
  await prisma.product.createMany({
    data: [
      { name: 'Arroz Biro-Biro', price: 15.9, type: ProductType.SIDE, categoryId: catSides.id },
      { name: 'Farofa de Ovos', price: 12.9, type: ProductType.SIDE, categoryId: catSides.id },
      { name: 'Fritas', price: 18.0, type: ProductType.SIDE, categoryId: catSides.id },
      { name: 'Salada de Maionese', price: 14.5, type: ProductType.SIDE, categoryId: catSides.id },
    ]
  })

  // 4. Cuts
  await prisma.product.createMany({
    data: [
      { name: 'Picanha Angus (500g)', price: 129.9, type: ProductType.CUT, categoryId: catCuts.id, description: 'Corte nobre, extremamente macio e suculento.' },
      { name: 'Bife Ancho (400g)', price: 95.0, type: ProductType.CUT, categoryId: catCuts.id, description: 'Extraído do lombo do boi, com gordura entremeada.' },
      { name: 'Maminha na Manteiga (500g)', price: 85.0, type: ProductType.CUT, categoryId: catCuts.id, description: 'Macia e com sabor característico da manteiga de garrafa.' }
    ]
  })

  // 5. Combos (Carnes que permitem acompanhar 3 guarnições)
  await prisma.product.create({
    data: {
      name: 'Combo Picanha Padrão',
      price: 159.0,
      type: ProductType.COMBO,
      categoryId: catCombos.id,
      description: '1 Picanha (500g) + 3 Acompanhamentos à sua escolha.',
      maxSides: 3
    }
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
