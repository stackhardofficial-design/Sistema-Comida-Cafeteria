'use server'

import { revalidatePath } from 'next/cache'
import { createClientServer } from '../server'

/**
 * Helper interno para obtener el tenant_id del usuario autenticado.
 * Solo puede ser llamado desde el servidor.
 */
async function getTenantIdOrThrow() {
  const supabase = await createClientServer()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  
  if (authError || !authData?.user) {
    throw new Error('No estás autenticado')
  }

  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !userProfile?.tenant_id) {
    throw new Error('No se pudo determinar el restaurante asignado al usuario')
  }

  return userProfile.tenant_id
}

export type ActionState = {
  success?: boolean
  message?: string
  error?: string
}

export async function crearCategoria(prevState: any, formData: FormData): Promise<ActionState> {
  const nombre = formData.get('nombre') as string
  const descripcion = formData.get('descripcion') as string

  if (!nombre) {
    return { error: 'El nombre de la categoría es requerido' }
  }

  try {
    const tenantId = await getTenantIdOrThrow()
    const supabase = await createClientServer()

    const { error } = await supabase
      .from('categories')
      .insert({
        tenant_id: tenantId,
        name: nombre,
        description: descripcion || null,
        is_active: true,
      })

    if (error) throw error

    revalidatePath('/admin/catalogo')
    return { success: true, message: 'Categoría creada con éxito' }
  } catch (error: any) {
    return { error: error.message || 'Ocurrió un error al crear la categoría' }
  }
}

export async function crearProducto(prevState: any, formData: FormData): Promise<ActionState> {
  const nombre = formData.get('nombre') as string
  const precio = parseFloat(formData.get('precio') as string)
  const categoriaId = formData.get('categoriaId') as string

  if (!nombre || isNaN(precio) || !categoriaId) {
    return { error: 'Faltan campos requeridos o el precio es inválido' }
  }

  try {
    const tenantId = await getTenantIdOrThrow()
    const supabase = await createClientServer()

    const { error } = await supabase
      .from('products')
      .insert({
        tenant_id: tenantId,
        name: nombre,
        price: precio,
        category_id: categoriaId,
        is_active: true,
      })

    if (error) throw error

    revalidatePath('/admin/catalogo')
    return { success: true, message: 'Producto creado con éxito' }
  } catch (error: any) {
    return { error: error.message || 'Ocurrió un error al crear el producto' }
  }
}
