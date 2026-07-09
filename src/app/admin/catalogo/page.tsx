import { createClientServer } from '../../../infrastructure/supabase/server'
import FormularioCategoria from './components/form-categoria'
import FormularioProducto from './components/form-producto'

export const metadata = {
  title: 'Catálogo | Panel Admin',
}

export default async function CatalogoPage() {
  const supabase = await createClientServer()

  // Al usar createClientServer (que tiene la sesión activa del usuario)
  // RLS (Row Level Security) garantiza que SOLO obtengamos las categorías
  // y productos que pertenezcan al tenant_id de este usuario.
  
  const { data: categorias, error: catError } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: productos, error: prodError } = await supabase
    .from('products')
    .select('*, categories(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Gestión de Catálogo</h1>
        <p className="mt-1 text-sm text-gray-500">
          Administra las categorías y productos de tu menú.
        </p>
      </div>

      {/* Formularios de Creación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FormularioCategoria />
        <FormularioProducto categorias={categorias || []} />
      </div>

      {/* Listados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lista de Categorías */}
        <div className="lg:col-span-1 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Categorías</h3>
          {categorias && categorias.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {categorias.map((cat) => (
                <li key={cat.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                    {cat.description && (
                      <p className="text-xs text-gray-500">{cat.description}</p>
                    )}
                  </div>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cat.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {cat.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No hay categorías registradas.</p>
          )}
        </div>

        {/* Lista de Productos */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Productos</h3>
          {productos && productos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productos.map((prod) => (
                    <tr key={prod.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{prod.name}</td>
                      {/* En Supabase JOINs, la relacion viene como un objeto */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prod.categories?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${prod.price}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${prod.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {prod.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No hay productos registrados.</p>
          )}
        </div>
      </div>
    </div>
  )
}
