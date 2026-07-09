import { createClientServer } from '@/infrastructure/supabase/server'
import { redirect } from 'next/navigation'
import { Store, Plus } from 'lucide-react'
import CategoryCard from './components/category-card'
import ProductCard from './components/product-card'
import CreateCategoryModal from './components/create-category-modal'
import CreateProductModal from './components/create-product-modal'

export const metadata = { title: 'Menú' }

export default async function MenuPage() {
  const supabase = await createClientServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('*').eq('tenant_id', profile!.tenant_id).order('sort_order'),
    supabase.from('products').select('*, categories(name), product_modifiers(*)').eq('tenant_id', profile!.tenant_id).order('name'),
  ])

  const groupedProducts = categories?.map(cat => ({
    ...cat,
    products: products?.filter(p => p.category_id === cat.id) || []
  })) || []

  const uncategorized = products?.filter(p => !p.category_id) || []

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Menú</h1>
          <p className="page-subtitle">
            {categories?.length || 0} categorías · {products?.length || 0} productos
          </p>
        </div>
        <div className="flex gap-3">
          <CreateCategoryModal />
          <CreateProductModal categories={categories || []} />
        </div>
      </div>

      {/* Categories + Products */}
      {!categories?.length ? (
        <div className="card">
          <div className="empty-state">
            <Store className="empty-state-icon h-12 w-12" />
            <p className="empty-state-title">No hay categorías</p>
            <p className="empty-state-desc">Crea una categoría para empezar a agregar productos a tu menú.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedProducts.map(cat => (
            <div key={cat.id}>
              <div className="flex items-center gap-3 mb-4">
                <CategoryCard category={cat} />
              </div>
              {cat.products.length === 0 ? (
                <p className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>
                  Sin productos en esta categoría
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {cat.products.map((product: any) => (
                    <ProductCard key={product.id} product={product} categories={categories || []} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {uncategorized.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>
                SIN CATEGORÍA
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {uncategorized.map((product: any) => (
                  <ProductCard key={product.id} product={product} categories={categories || []} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
