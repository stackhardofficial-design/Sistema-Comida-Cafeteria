import Link from 'next/link'
import { LayoutDashboard, Store, Users, LogOut } from 'lucide-react'
import { createClientServer } from '../../infrastructure/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClientServer()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Fijo Desktop */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex md:flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-gray-800">Sistema</span>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          <Link href="/admin" className="flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900">
            <LayoutDashboard className="mr-3 h-5 w-5 text-gray-400" />
            Dashboard
          </Link>
          <Link href="/admin/catalogo" className="flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900">
            <Store className="mr-3 h-5 w-5 text-gray-400" />
            Catálogo
          </Link>
          <Link href="/admin/personal" className="flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900">
            <Users className="mr-3 h-5 w-5 text-gray-400" />
            Personal
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center md:hidden">
            {/* TODO: Botón hamburguesa para mobile */}
            <span className="text-xl font-bold text-gray-800">Sistema</span>
          </div>
          <div className="flex items-center justify-end w-full space-x-4">
            <span className="text-sm text-gray-500">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="text-gray-400 hover:text-gray-500">
                <LogOut className="h-5 w-5" />
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
