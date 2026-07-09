import { createClientServer } from '@/infrastructure/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClientServer()
  await supabase.auth.signOut()
  
  const url = new URL('/login', request.url)
  return NextResponse.redirect(url, { status: 302 })
}
