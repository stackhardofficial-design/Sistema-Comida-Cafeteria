import { Client } from 'pg';

const connectionString = 'postgresql://postgres:s_%247%2BZm4N%2Bp%2FS%237@db.mylukzjucxgjjmvbteuf.supabase.co:5432/postgres';

const sql = `
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  v_tenant_id := (nullif(current_setting('request.jwt.claim.tenant_id', true), ''))::uuid;
  IF v_tenant_id IS NULL THEN
    SELECT tenant_id INTO v_tenant_id FROM users WHERE id = auth.uid();
  END IF;
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
`;

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to DB');
    await client.query(sql);
    console.log('Successfully updated get_current_tenant_id function!');
  } catch (err) {
    console.error('Error updating function:', err);
  } finally {
    await client.end();
  }
}

run();
