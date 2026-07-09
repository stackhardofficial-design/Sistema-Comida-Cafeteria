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
  
  // 1. Get the superadmin user
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
  
  // 2. Check if a Demo tenant exists
  let { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', 'demo-restaurant')
    .single()
    
  if (tenantError || !tenant) {
    console.log('Creating Demo Restaurant tenant...')
    const { data: newTenant, error: insertError } = await supabase
      .from('tenants')
      .insert({
        name: 'Restaurante Demo',
        slug: 'demo-restaurant',
        currency: 'ARS'
      })
      .select()
      .single()
      
    if (insertError) {
      console.error('Failed to create tenant:', insertError)
      return
    }
    tenant = newTenant
    console.log('Created Demo tenant:', tenant.id)
    
    // Seed some initial data for the demo restaurant if needed (Categories, Products, Tables)
    const { data: cat } = await supabase.from('categories').insert({ tenant_id: tenant.id, name: 'Bebidas' }).select().single()
    if (cat) {
        await supabase.from('products').insert([
            { tenant_id: tenant.id, category_id: cat.id, name: 'Coca Cola', price: 1500 },
            { tenant_id: tenant.id, category_id: cat.id, name: 'Agua', price: 1000 }
        ])
    }
    await supabase.from('restaurant_tables').insert([
        { tenant_id: tenant.id, name: 'Mesa 1' },
        { tenant_id: tenant.id, name: 'Mesa 2' }
    ])
  } else {
    console.log('Demo tenant already exists:', tenant.id)
  }
  
  // 3. Assign super_admin to this tenant
  const { error: updateError } = await supabase
    .from('users')
    .update({ tenant_id: tenant.id })
    .eq('id', user.id)
    
  if (updateError) {
    console.error('Failed to update user tenant_id:', updateError)
  } else {
    console.log(`Assigned super_admin (${user.id}) to tenant ${tenant.id}`)
  }
}

run()
