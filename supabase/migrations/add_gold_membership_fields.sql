-- Add Gold Membership fields to users table
ALTER TABLE IF EXISTS auth.users ADD COLUMN IF NOT EXISTS is_gold BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS auth.users ADD COLUMN IF NOT EXISTS gold_subscribed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE IF EXISTS auth.users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE IF EXISTS auth.users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE IF EXISTS auth.users ADD COLUMN IF NOT EXISTS subscription_status TEXT;

-- Create users profile table if it doesn't exist (for additional user data)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_gold BOOLEAN DEFAULT false,
  gold_subscribed_at TIMESTAMP WITH TIME ZONE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  carcoin_balance INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON public.users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON public.users(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_is_gold ON public.users(is_gold);

-- Update transaction_type enum if it doesn't include subscription
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
    CREATE TYPE transaction_type AS ENUM ('service', 'subscription', 'carcoin_purchase', 'refund');
  ELSE
    ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'subscription';
  END IF;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at_trigger ON public.users;
CREATE TRIGGER update_users_updated_at_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

COMMENT ON TABLE public.users IS 'Extended user profile data including Gold membership status';
COMMENT ON COLUMN public.users.is_gold IS 'Whether user has active Gold membership';
COMMENT ON COLUMN public.users.carcoin_balance IS 'User CarCoin balance for rewards';
COMMENT ON COLUMN public.users.stripe_customer_id IS 'Stripe customer ID for recurring billing';
COMMENT ON COLUMN public.users.stripe_subscription_id IS 'Active Stripe subscription ID';
