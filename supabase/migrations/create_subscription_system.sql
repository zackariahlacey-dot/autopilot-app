-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'gold', 'platinum')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_perks table for tracking feature usage
CREATE TABLE IF NOT EXISTS subscription_perks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  perk_type TEXT NOT NULL CHECK (perk_type IN ('cashback', 'priority_chat', 'auto_schedule', 'multi_vehicle', 'concierge')),
  used_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create proactive_reminders table
CREATE TABLE IF NOT EXISTS proactive_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('mileage', 'time_based', 'seasonal', 'recall')),
  service_type TEXT NOT NULL,
  due_date DATE,
  due_mileage INTEGER,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged', 'scheduled', 'dismissed')),
  message TEXT,
  quotes_found INTEGER DEFAULT 0,
  cheapest_quote_amount INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_perks ENABLE ROW LEVEL SECURITY;
ALTER TABLE proactive_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription"
ON subscriptions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription"
ON subscriptions FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for subscription_perks
CREATE POLICY "Users can view their own perks"
ON subscription_perks FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for proactive_reminders
CREATE POLICY "Users can view their own reminders"
ON proactive_reminders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own reminders"
ON proactive_reminders FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX idx_subscription_perks_user ON subscription_perks(user_id);
CREATE INDEX idx_proactive_reminders_user ON proactive_reminders(user_id);
CREATE INDEX idx_proactive_reminders_vehicle ON proactive_reminders(vehicle_id);
CREATE INDEX idx_proactive_reminders_status ON proactive_reminders(status);

-- Function to create free subscription on user signup
CREATE OR REPLACE FUNCTION create_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create subscription on signup
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_subscription();

-- Function to apply Gold cashback on booking completion
CREATE OR REPLACE FUNCTION apply_gold_cashback()
RETURNS TRIGGER AS $$
DECLARE
  user_subscription TEXT;
  cashback_amount INTEGER;
BEGIN
  -- Only process if booking is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Get user's subscription tier
    SELECT tier INTO user_subscription
    FROM subscriptions
    WHERE user_id = NEW.user_id
    AND status = 'active';
    
    -- Apply 5% cashback for Gold members
    IF user_subscription = 'gold' THEN
      -- Get booking amount from services table
      SELECT (price * 0.05)::INTEGER INTO cashback_amount
      FROM services
      WHERE id = NEW.service_id;
      
      -- Add cashback to wallet
      UPDATE user_wallets
      SET balance = balance + cashback_amount,
          lifetime_earned = lifetime_earned + cashback_amount
      WHERE user_id = NEW.user_id;
      
      -- Create transaction record
      INSERT INTO wallet_transactions (user_id, amount, type, description, booking_id)
      VALUES (NEW.user_id, cashback_amount, 'loyalty_reward', 'Autopilot Gold 5% Cashback', NEW.id);
      
      -- Track perk usage
      INSERT INTO subscription_perks (user_id, perk_type, used_count, last_used_at)
      VALUES (NEW.user_id, 'cashback', 1, NOW())
      ON CONFLICT (user_id, perk_type) 
      DO UPDATE SET used_count = subscription_perks.used_count + 1, last_used_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic cashback
CREATE TRIGGER on_booking_completed_cashback
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION apply_gold_cashback();

-- Comments
COMMENT ON TABLE subscriptions IS 'User subscription tiers (Free, Gold, Platinum)';
COMMENT ON TABLE subscription_perks IS 'Track usage of subscription features';
COMMENT ON TABLE proactive_reminders IS 'AI-generated maintenance reminders';
COMMENT ON COLUMN subscriptions.tier IS 'Subscription tier: free, gold, platinum';
COMMENT ON COLUMN proactive_reminders.reminder_type IS 'Type: mileage, time_based, seasonal, recall';
