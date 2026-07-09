'use server'

import { createClientServer, createAdminClient } from '../server'
import { revalidatePath } from 'next/cache'

export type ActionState = {
  success?: boolean
  message?: string
  error?: string
}

async function getExecutor() {
  const supabase = await createClientServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  return profile
}

// ===================== CATEGORIES =====================

export async function createCategory(prevState: any, formData: FormData): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor || !['owner', 'admin', 'manager'].includes(executor.role)) {
    return { error: 'Sin permisos' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const sortOrder = parseInt(formData.get('sortOrder') as string) || 0

  if (!name) return { error: 'El nombre es requerido' }

  const supabase = await createClientServer()
  const { error } = await supabase.from('categories').insert({
    tenant_id: executor.tenant_id,
    name,
    description: description || null,
    sort_order: sortOrder,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/menu')
  return { success: true, message: 'Categoría creada exitosamente' }
}

export async function updateCategory(prevState: any, formData: FormData): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor || !['owner', 'admin', 'manager'].includes(executor.role)) {
    return { error: 'Sin permisos' }
  }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const sortOrder = parseInt(formData.get('sortOrder') as string) || 0
  const isActive = formData.get('isActive') === 'true'

  const supabase = await createClientServer()
  const { error } = await supabase
    .from('categories')
    .update({ name, description: description || null, sort_order: sortOrder, is_active: isActive })
    .eq('id', id)
    .eq('tenant_id', executor.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/admin/menu')
  return { success: true, message: 'Categoría actualizada' }
}

export async function deleteCategory(categoryId: string): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor || !['owner', 'admin'].includes(executor.role)) {
    return { error: 'Sin permisos' }
  }

  const supabase = await createClientServer()
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .eq('tenant_id', executor.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/admin/menu')
  return { success: true, message: 'Categoría eliminada' }
}

// ===================== PRODUCTS =====================

export async function createProduct(prevState: any, formData: FormData): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor || !['owner', 'admin', 'manager'].includes(executor.role)) {
    return { error: 'Sin permisos' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const categoryId = formData.get('categoryId') as string
  const preparationTime = parseInt(formData.get('preparationTime') as string) || 10
  const isFeatured = formData.get('isFeatured') === 'true'

  if (!name || isNaN(price)) return { error: 'Nombre y precio son requeridos' }

  const supabase = await createClientServer()
  const { error } = await supabase.from('products').insert({
    tenant_id: executor.tenant_id,
    name,
    description: description || null,
    price,
    category_id: categoryId || null,
    preparation_time_minutes: preparationTime,
    is_featured: isFeatured,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/menu')
  return { success: true, message: 'Producto creado exitosamente' }
}

export async function updateProduct(prevState: any, formData: FormData): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor || !['owner', 'admin', 'manager'].includes(executor.role)) {
    return { error: 'Sin permisos' }
  }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const categoryId = formData.get('categoryId') as string
  const preparationTime = parseInt(formData.get('preparationTime') as string) || 10
  const isFeatured = formData.get('isFeatured') === 'true'

  const supabase = await createClientServer()
  const { error } = await supabase
    .from('products')
    .update({
      name,
      description: description || null,
      price,
      category_id: categoryId || null,
      preparation_time_minutes: preparationTime,
      is_featured: isFeatured,
    })
    .eq('id', id)
    .eq('tenant_id', executor.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/admin/menu')
  return { success: true, message: 'Producto actualizado' }
}

export async function toggleProductActive(productId: string, isActive: boolean): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor || !['owner', 'admin', 'manager'].includes(executor.role)) {
    return { error: 'Sin permisos' }
  }

  const supabase = await createClientServer()
  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', productId)
    .eq('tenant_id', executor.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/admin/menu')
  return { success: true }
}

export async function deleteProduct(productId: string): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor || !['owner', 'admin'].includes(executor.role)) {
    return { error: 'Sin permisos' }
  }

  const supabase = await createClientServer()
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('tenant_id', executor.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/admin/menu')
  return { success: true, message: 'Producto eliminado' }
}

// ===================== MODIFIERS =====================

export async function createModifier(prevState: any, formData: FormData): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor || !['owner', 'admin', 'manager'].includes(executor.role)) {
    return { error: 'Sin permisos' }
  }

  const productId = formData.get('productId') as string
  const name = formData.get('name') as string
  const priceAdjustment = parseFloat(formData.get('priceAdjustment') as string) || 0

  if (!productId || !name) return { error: 'Faltan campos requeridos' }

  const supabase = await createClientServer()
  const { error } = await supabase.from('product_modifiers').insert({
    tenant_id: executor.tenant_id,
    product_id: productId,
    name,
    price_adjustment: priceAdjustment,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/menu')
  return { success: true, message: 'Modificador creado' }
}

export async function deleteModifier(modifierId: string): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor || !['owner', 'admin', 'manager'].includes(executor.role)) {
    return { error: 'Sin permisos' }
  }

  const supabase = await createClientServer()
  const { error } = await supabase
    .from('product_modifiers')
    .delete()
    .eq('id', modifierId)
    .eq('tenant_id', executor.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/admin/menu')
  return { success: true }
}
