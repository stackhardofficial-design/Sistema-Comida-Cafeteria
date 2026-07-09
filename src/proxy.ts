import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Public routes (always accessible)
  const publicRoutes = ['/login', '/auth']
  if (publicRoutes.some(r => pathname.startsWith(r))) {
    if (user) {
      // If logged in and trying to access login, redirect to dashboard
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return supabaseResponse
  }

  // Not logged in → login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Get user role for RBAC
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  const role = userProfile?.role

  // Route → Allowed Roles
  const roleRoutes: Record<string, string[]> = {
    '/super-admin': ['super_admin'],
    '/admin':       ['super_admin', 'owner', 'admin', 'manager', 'cashier'],
    '/pos':         ['super_admin', 'owner', 'admin', 'manager', 'waiter', 'cashier'],
    '/kitchen':     ['super_admin', 'owner', 'admin', 'manager', 'kitchen'],
    '/delivery':    ['super_admin', 'owner', 'admin', 'manager', 'delivery'],
  }

  for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(route)) {
      if (!role || !allowedRoles.includes(role)) {
        // Redirect to the correct dashboard for this role
        const redirectMap: Record<string, string> = {
          super_admin: '/super-admin',
          owner:       '/admin',
          admin:       '/admin',
          manager:     '/admin',
          cashier:     '/admin/caja',
          waiter:      '/pos',
          kitchen:     '/kitchen',
          delivery:    '/delivery',
        }
        const target = redirectMap[role ?? ''] ?? '/login'
        return NextResponse.redirect(new URL(target, request.url))
      }
      break
    }
  }

  // Root redirect: send to correct dashboard
  if (pathname === '/') {
    const redirectMap: Record<string, string> = {
      super_admin: '/super-admin',
      owner:       '/admin',
      admin:       '/admin',
      manager:     '/admin',
      cashier:     '/admin/caja',
      waiter:      '/pos',
      kitchen:     '/kitchen',
      delivery:    '/delivery',
    }
    const target = redirectMap[role ?? ''] ?? '/login'
    return NextResponse.redirect(new URL(target, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
