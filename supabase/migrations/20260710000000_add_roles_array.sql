-- Migration: Add roles array column to users table
-- This allows employees to have multiple roles (e.g., waiter + cashier)

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT NULL;

-- Initialize roles array from existing single role for existing users
-- (skip super_admin and owner as they have full access already)
UPDATE users 
SET roles = ARRAY[role]
WHERE roles IS NULL 
  AND role NOT IN ('super_admin');

-- Comment for documentation
COMMENT ON COLUMN users.roles IS 'Array of roles for multi-role employees. Primary role is still stored in users.role for backward compatibility.';
