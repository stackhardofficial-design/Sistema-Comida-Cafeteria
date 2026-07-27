-- Add paid_until column to tenants to track monthly subscriptions
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS paid_until DATE;

-- By default, existing tenants (except StackHard Central) might need a grace period if we want, but we will manage this via UI.
-- StackHard Central doesn't need it because SuperAdmin bypasses the check.
