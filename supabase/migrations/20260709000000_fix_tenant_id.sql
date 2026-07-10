-- Fix get_current_tenant_id to fallback to public.users if JWT claim is missing

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
