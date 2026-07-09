'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createUserAccount, type AuthActionState } from '../../../../infrastructure/supabase/auth/actions'
import { Loader2, UserPlus } from 'lucide-react'

const initialState: AuthActionState = {}

export default function FormularioEmpleado() {
  const [state, formAction, pending] = useActionState(createUserAccount, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
    }
  }, [state])

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Registrar Nuevo Empleado</h2>
      
      <form ref={formRef} action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              type="text"
              name="firstName"
              id="firstName"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="Ej. Juan"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Apellido
            </label>
            <input
              type="text"
              name="lastName"
              id="lastName"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="Ej. Pérez"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Correo electrónico (Email)
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            placeholder="empleado@ejemplo.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Contraseña de acceso
          </label>
          <input
            type="password"
            name="password"
            id="password"
            required
            minLength={6}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Rol del empleado
          </label>
          <select
            id="role"
            name="role"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border bg-white"
          >
            <option value="">Selecciona un rol...</option>
            <option value="waiter">Mesero (Waiter)</option>
            <option value="kitchen">Cocina (Kitchen)</option>
            <option value="cashier">Cajero (Cashier)</option>
            <option value="manager">Gerente (Manager)</option>
          </select>
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
          ) : (
            <UserPlus className="h-5 w-5 mr-2" />
          )}
          {pending ? 'Creando cuenta...' : 'Crear Empleado'}
        </button>
      </form>
    </div>
  )
}
