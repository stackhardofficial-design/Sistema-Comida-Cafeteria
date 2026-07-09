import { createClientServer } from '../../../infrastructure/supabase/server'
import FormularioEmpleado from './components/form-empleado'

export const metadata = {
  title: 'Personal | Panel Admin',
}

export default async function PersonalPage() {
  const supabase = await createClientServer()

  // Leer todos los usuarios
  // Debido al RLS (Row Level Security) que configuramos en la base de datos,
  // la tabla `users` automáticamente filtrará y solo retornará los registros
  // donde el tenant_id coincida con el tenant_id del usuario actual (el Admin).
  const { data: empleados, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, role, created_at, tenant_id') // Excluímos id real por seguridad si quisiéramos, pero 'id' viene de auth.users
    .order('created_at', { ascending: false })

  // Mapeo de roles a nombres más amigables
  const roleNames: Record<string, string> = {
    owner: 'Dueño',
    admin: 'Administrador',
    manager: 'Gerente',
    kitchen: 'Cocina',
    waiter: 'Mesero',
    cashier: 'Cajero'
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Gestión de Personal</h1>
        <p className="mt-1 text-sm text-gray-500">
          Administra las cuentas de acceso para los empleados de tu restaurante.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulario Lateral */}
        <div className="lg:col-span-1">
          <FormularioEmpleado />
        </div>

        {/* Lista de Empleados */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Empleados Activos</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Registro
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {empleados && empleados.length > 0 ? (
                  empleados.map((empleado) => (
                    <tr key={empleado.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                            {empleado.first_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {empleado.first_name} {empleado.last_name || ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${empleado.role === 'owner' || empleado.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}
                        `}>
                          {roleNames[empleado.role] || empleado.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(empleado.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                      No hay empleados registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
