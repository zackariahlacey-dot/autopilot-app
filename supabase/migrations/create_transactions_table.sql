-- Create transactions table for digital receipts and financial tracking
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  business_id uuid REFERENCES businesses(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  
  -- Financial details
  amount integer NOT NULL, -- in cents
  currency text DEFAULT 'usd',
  
  -- Service details at time of transaction
  service_name text NOT NULL,
  service_description text,
  mechanic_name text,
  vehicle_mileage integer,
  
  -- Metadata
  completed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT transactions_amount_positive CHECK (amount > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_vehicle_id ON transactions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_transactions_business_id ON transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_transactions_completed_at ON transactions(completed_at);

-- RLS Policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Business owners can view their business transactions
CREATE POLICY "Business owners can view their transactions"
  ON transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = transactions.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE transactions IS 'Digital receipts and transaction records for completed services';
COMMENT ON COLUMN transactions.amount IS 'Transaction amount in cents';
COMMENT ON COLUMN transactions.vehicle_mileage IS 'Vehicle mileage at time of service completion';
