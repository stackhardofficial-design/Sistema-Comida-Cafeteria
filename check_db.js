import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mylukzjucxgjjmvbteuf.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bHVremp1Y3hnamptdmJ0ZXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NTgzMzQsImV4cCI6MjA5OTEzNDMzNH0.82zOrsjibu3S898QJAv2mY41hgXe399cYVgBCLXVHm0'

const sb = createClient(SUPABASE_URL, SUPABASE_ANON)

async function run() {
  const tenantId = '56e7c452-b49f-4192-8fbd-283e5af0a3aa'

  // Without notes
  const { data, error } = await sb.from('delivery_addresses').insert({
    tenant_id: tenantId,
    street_address: 'Test St 123',
    customer_name: 'Test Client',
    customer_phone: '11-1234-5678',
    city: 'Buenos Aires',
    postal_code: '1000',
    country: 'AR',
    latitude: null,
    longitude: null,
  }).select()

  if (!error) {
    console.log('SUCCESS! delivery_addresses columns:', Object.keys(data[0]))
    console.log('Sample row:', data[0])
    await sb.from('delivery_addresses').delete().eq('id', data[0].id)
  } else {
    console.log(`Failed: ${error.message}`, error.details)
  }
}

run()
