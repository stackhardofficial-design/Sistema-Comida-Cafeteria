'use client'

import { useActionState, useEffect, useRef } from 'react'
import { crearCategoria, ActionState } from '../../../../infrastructure/supabase/catalogo/actions'
import { Loader2, PlusCircle } from 'lucide-react'

const initialState: ActionState = {}

export default function FormularioCategoria() {
  const [state, formAction, pending] = useActionState(crearCategoria, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
    }
  }, [state])

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Nueva Categoría</h2>
      
      <form ref={formRef} action={formAction} className="space-y-4">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
            Nombre de la categoría
          </label>
          <input
            type="text"
            name="nombre"
            id="nombre"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            placeholder="Ej. Bebidas, Postres"
          />
        </div>

        <div>
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
            Descripción (opcional)
          </label>
          <input
            type="text"
            name="descripcion"
            id="descripcion"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            placeholder="Descripción breve..."
          />
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
            <PlusCircle className="h-5 w-5 mr-2" />
          )}
          {pending ? 'Guardando...' : 'Crear Categoría'}
        </button>
      </form>
    </div>
  )
}
