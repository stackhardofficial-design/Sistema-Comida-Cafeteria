import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  const email = 'superadmin@stackhard.com'
  
  // 1. Get auth user
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  if (authError) {
    console.error('Error fetching auth users:', authError)
    return
  }
  
  const user = authUsers.users.find(u => u.email === email)
  if (!user) {
    console.log(`User ${email} not found in auth.users`)
    return
  }
  
  console.log(`Found auth user ${user.email} with ID ${user.id}`)
  
  // 2. Check public.users
  const { data: publicUser, error: publicError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
    
  if (publicError) {
    console.error('Error fetching public.users (might be not found):', publicError)
    
    // Attempt to insert
    console.log('Inserting into public.users...')
    const { data: inserted, error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        role: 'super_admin',
        first_name: 'Super',
        last_name: 'Admin',
        is_active: true,
        tenant_id: null // Super admin has no tenant
      })
      .select()
      
    if (insertError) {
      console.error('Failed to insert user:', insertError)
    } else {
      console.log('Successfully inserted super_admin user:', inserted)
    }
  } else {
    console.log('User exists in public.users:', publicUser)
  }
}

run()
