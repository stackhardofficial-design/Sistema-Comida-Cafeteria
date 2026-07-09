import { createClient } from '@supabase/supabase-js';

// Environment variables are typically used here, but we pass them explicitly for this example setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Singleton client for standard operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For admin/backend operations that need to bypass RLS (e.g. webhooks)
export const getServiceRoleClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '', 
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
};
