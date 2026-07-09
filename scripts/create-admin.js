require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const email = 'admin@stackhard.com';
  const password = 'Password123!';
  const tenantName = 'StackHard Central';

  console.log('1. Creating Tenant...');
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({ name: tenantName, slug: 'stackhard-central', currency: 'USD' })
    .select()
    .single();

  if (tenantError) {
    console.error('Error creating tenant:', tenantError);
    return;
  }
  console.log('Tenant created:', tenant.id);

  console.log('2. Creating User in Auth...');
  const { data: userAuth, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    return;
  }
  console.log('Auth user created:', userAuth.user.id);

  console.log('3. Inserting Profile...');
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: userAuth.user.id,
      tenant_id: tenant.id,
      role: 'owner',
      first_name: 'Admin',
      last_name: 'StackHard'
    });

  if (profileError) {
    console.error('Error creating profile:', profileError);
    return;
  }

  console.log('SUCCESS! Admin user created.');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main();
