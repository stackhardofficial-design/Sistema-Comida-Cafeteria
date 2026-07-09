import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, Store, Users, LogOut, Coffee } from 'lucide-react'
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
      <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex md:flex-col shadow-xl z-20">
        <div className="h-16 flex items-center justify-center px-6 border-b border-slate-800/50 bg-slate-950/50">
          <Image src="/logo.png" alt="Logo" width={140} height={40} className="object-contain" priority />
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Principal</p>
          <Link href="/admin" className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <LayoutDashboard className="mr-3 h-5 w-5 text-slate-400" />
            Dashboard
          </Link>
          <Link href="/admin/catalogo" className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <Store className="mr-3 h-5 w-5 text-slate-400" />
            Catálogo
          </Link>
          <Link href="/admin/personal" className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <Users className="mr-3 h-5 w-5 text-slate-400" />
            Personal
          </Link>
          
          <div className="pt-6">
             <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Operación</p>
             <Link href="/pos" className="flex items-center px-3 py-2.5 text-sm font-medium text-blue-400 rounded-lg hover:bg-slate-800 hover:text-blue-300 transition-colors">
               <Coffee className="mr-3 h-5 w-5 text-blue-500" />
               Abrir POS
             </Link>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-6 z-10 relative">
          <div className="flex items-center md:hidden">
            <Image src="/logo.png" alt="Logo" width={100} height={30} className="object-contain" priority />
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
