"use server"

import { prisma } from '@/lib/prisma'
import { ProductType } from '@prisma/client'

export async function toggleProductActive(productId: string, currentStatus: boolean) {
  try {
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { isActive: !currentStatus }
    })
    return { success: true, isActive: updated.isActive }
  } catch (error) {
    console.error("Erro toggleProductActive:", error)
    return { success: false, error: 'Erro na conexão com o banco ao alterar produto.' }
  }
}

export async function saveProduct(data: {
  id?: string,
  name: string,
  price: number,
  description: string,
  type: ProductType,
  imageUrl: string,
  categoryId: string
}) {
  try {
    if (data.id) {
      await prisma.product.update({
        where: { id: data.id },
        data: {
          name: data.name,
          price: data.price,
          description: data.description,
          type: data.type,
          imageUrl: data.imageUrl,
          categoryId: data.categoryId
        }
      })
    } else {
      await prisma.product.create({
        data: {
          name: data.name,
          price: data.price,
          description: data.description,
          type: data.type,
          imageUrl: data.imageUrl,
          categoryId: data.categoryId,
          isActive: true
        }
      })
    }
    return { success: true }
  } catch (error) {
    console.error("Erro no saveProduct:", error)
    return { success: false, error: 'Erro ao salvar produto no banco.' }
  }
}

export async function toggleStoreStatus(currentStatus: boolean) {
  try {
    const settings = await prisma.storeSettings.upsert({
      where: { id: 'singleton' },
      update: { isOpen: !currentStatus },
      create: { id: 'singleton', isOpen: !currentStatus }
    })
    return { success: true, isOpen: settings.isOpen }
  } catch (error) {
    console.error("Erro toggleStoreStatus:", error)
    return { success: false, error: 'Erro ao alterar status da loja.' }
  }
}

export async function getStoreSettings() {
  try {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: 'singleton' }
    })
    return settings ?? { id: 'singleton', isOpen: true }
  } catch {
    return { id: 'singleton', isOpen: true }
  }
}
