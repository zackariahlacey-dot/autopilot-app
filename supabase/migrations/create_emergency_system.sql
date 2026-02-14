-- Add 'emergency' priority level to bookings
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'emergency';

-- Add emergency-specific fields to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS emergency_location JSONB;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS dispatch_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS arrival_eta INTEGER; -- in minutes
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS driver_phone TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS driver_name TEXT;

-- Create emergency_requests tracking table
CREATE TABLE IF NOT EXISTS emergency_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  
  -- Location data
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  
  -- Emergency details
  emergency_type TEXT NOT NULL, -- 'towing', 'flat_tire', 'dead_battery', 'lockout', 'accident'
  description TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'searching', -- 'searching', 'dispatched', 'en_route', 'arrived', 'resolved', 'cancelled'
  priority INTEGER DEFAULT 1, -- 1 = critical, 2 = high, 3 = normal
  
  -- Business/driver info
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  driver_name TEXT,
  driver_phone TEXT,
  eta_minutes INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dispatched_at TIMESTAMP WITH TIME ZONE,
  arrived_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE emergency_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own emergency requests"
ON emergency_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create emergency requests"
ON emergency_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own emergency requests"
ON emergency_requests FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Businesses can view assigned emergency requests"
ON emergency_requests FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Businesses can update assigned emergency requests"
ON emergency_requests FOR UPDATE
TO authenticated
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Indexes for performance
CREATE INDEX idx_emergency_requests_user ON emergency_requests(user_id);
CREATE INDEX idx_emergency_requests_business ON emergency_requests(business_id);
CREATE INDEX idx_emergency_requests_status ON emergency_requests(status);
CREATE INDEX idx_emergency_requests_created ON emergency_requests(created_at DESC);
CREATE INDEX idx_emergency_requests_location ON emergency_requests(latitude, longitude);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_emergency_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamps
CREATE TRIGGER trigger_emergency_requests_updated_at
  BEFORE UPDATE ON emergency_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_emergency_requests_updated_at();

-- Add towing/roadside categories to businesses if not exist
-- (This is informational - categories should already exist)
COMMENT ON TABLE emergency_requests IS 'Emergency roadside assistance requests with live tracking';
COMMENT ON COLUMN emergency_requests.status IS 'searching: Looking for help | dispatched: Business accepted | en_route: Driver on the way | arrived: Driver at location | resolved: Issue fixed | cancelled: Request cancelled';
COMMENT ON COLUMN emergency_requests.priority IS '1 = Critical (immediate danger), 2 = High (stranded), 3 = Normal (can wait)';
COMMENT ON COLUMN emergency_requests.emergency_type IS 'Type of roadside emergency: towing, flat_tire, dead_battery, lockout, accident';
