-- Create user_wallets table for CarCoins
CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER DEFAULT 5000, -- CarCoins in cents (50 coins = 5000)
  lifetime_earned INTEGER DEFAULT 5000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet_transactions table for tracking coin movements
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive for earnings, negative for spending
  type TEXT NOT NULL CHECK (type IN ('signup_bonus', 'referral_bonus', 'service_discount', 'loyalty_reward', 'booking_cashback')),
  description TEXT,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'claimed')),
  reward_amount INTEGER DEFAULT 2000, -- $20 = 2000 cents
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_referrer_code UNIQUE(referrer_id, referral_code)
);

-- Create loyalty_ranks table
CREATE TABLE IF NOT EXISTS loyalty_ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_rank TEXT DEFAULT 'beginner' CHECK (current_rank IN ('beginner', 'pro_driver', 'expert', 'legend')),
  health_streak_days INTEGER DEFAULT 0, -- Days at 100% health
  total_services INTEGER DEFAULT 0,
  lifetime_spent INTEGER DEFAULT 0, -- Total spent in cents
  badges JSONB DEFAULT '[]', -- Array of earned badges
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_ranks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_wallets
CREATE POLICY "Users can view their own wallet"
ON user_wallets FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own wallet"
ON user_wallets FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for wallet_transactions
CREATE POLICY "Users can view their own transactions"
ON wallet_transactions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for referrals
CREATE POLICY "Users can view their own referrals"
ON referrals FOR SELECT
TO authenticated
USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());

CREATE POLICY "Users can create referrals"
ON referrals FOR INSERT
TO authenticated
WITH CHECK (referrer_id = auth.uid());

-- RLS Policies for loyalty_ranks
CREATE POLICY "Users can view their own loyalty rank"
ON loyalty_ranks FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view other users' ranks"
ON loyalty_ranks FOR SELECT
TO authenticated
USING (true); -- Public for leaderboards

-- Indexes
CREATE INDEX idx_user_wallets_user ON user_wallets(user_id);
CREATE INDEX idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_created ON wallet_transactions(created_at DESC);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_loyalty_ranks_user ON loyalty_ranks(user_id);
CREATE INDEX idx_loyalty_ranks_rank ON loyalty_ranks(current_rank);

-- Function to create wallet on user signup
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_wallets (user_id, balance, lifetime_earned)
  VALUES (NEW.id, 5000, 5000);
  
  INSERT INTO wallet_transactions (user_id, amount, type, description)
  VALUES (NEW.id, 5000, 'signup_bonus', 'Welcome bonus! 50 CarCoins to get you started.');
  
  INSERT INTO loyalty_ranks (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create wallet on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_wallet();

-- Comments
COMMENT ON TABLE user_wallets IS 'User CarCoin wallet balances';
COMMENT ON TABLE wallet_transactions IS 'History of all CarCoin transactions';
COMMENT ON TABLE referrals IS 'Referral tracking for viral growth';
COMMENT ON TABLE loyalty_ranks IS 'User loyalty ranks and badges';
COMMENT ON COLUMN user_wallets.balance IS 'Current CarCoin balance in cents (100 cents = 1 coin)';
COMMENT ON COLUMN loyalty_ranks.health_streak_days IS 'Consecutive days vehicle has been at 100% health';
