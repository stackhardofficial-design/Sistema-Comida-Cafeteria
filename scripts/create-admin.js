require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const email = 'tomas@stackhard.com';
  const password = 'Tomas2812#';
  const tenantSlug = 'stackhard-central';

  console.log('1. Getting Tenant...');
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single();

  if (tenantError) {
    console.error('Error finding tenant:', tenantError);
    return;
  }
  console.log('Tenant found:', tenant.id);

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
      first_name: 'Tomas',
      last_name: ''
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
