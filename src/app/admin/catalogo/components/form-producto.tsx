'use client'

import { useActionState, useEffect, useRef } from 'react'
import { crearProducto, ActionState } from '../../../../infrastructure/supabase/catalogo/actions'
import { Loader2, PackagePlus } from 'lucide-react'

const initialState: ActionState = {}

interface FormularioProductoProps {
  categorias: { id: string; name: string }[]
}

export default function FormularioProducto({ categorias }: FormularioProductoProps) {
  const [state, formAction, pending] = useActionState(crearProducto, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
    }
  }, [state])

  if (categorias.length === 0) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center text-sm text-gray-500">
        Debes crear al menos una categoría antes de poder agregar productos.
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Nuevo Producto</h2>
      
      <form ref={formRef} action={formAction} className="space-y-4">
        <div>
          <label htmlFor="nombreProd" className="block text-sm font-medium text-gray-700">
            Nombre del producto
          </label>
          <input
            type="text"
            name="nombre"
            id="nombreProd"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            placeholder="Ej. Hamburguesa Clásica"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="precio" className="block text-sm font-medium text-gray-700">
              Precio
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="precio"
                id="precio"
                step="0.01"
                min="0"
                required
                className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="categoriaId" className="block text-sm font-medium text-gray-700">
              Categoría
            </label>
            <select
              id="categoriaId"
              name="categoriaId"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border bg-white"
            >
              <option value="">Seleccionar...</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-green-600 bg-green-50 p-2 rounded">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
          ) : (
            <PackagePlus className="h-5 w-5 mr-2" />
          )}
          {pending ? 'Guardando...' : 'Crear Producto'}
        </button>
      </form>
    </div>
  )
}
