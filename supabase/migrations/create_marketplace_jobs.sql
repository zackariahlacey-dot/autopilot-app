-- Create marketplace_jobs table for RFP/Quote system
CREATE TABLE IF NOT EXISTS marketplace_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  category TEXT NOT NULL, -- 'oil_change', 'detailing', 'mechanic', etc.
  service_type TEXT NOT NULL, -- e.g., 'Brake Inspection', 'Oil Change', 'Detail'
  description TEXT, -- User's problem description
  urgency TEXT DEFAULT 'normal', -- 'urgent', 'normal', 'flexible'
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'quoted', 'accepted', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 days'),
  CONSTRAINT valid_category CHECK (category IN ('oil_change', 'detailing', 'mechanic', 'tire_shop', 'body_shop', 'glass_repair', 'gas_station', 'dealership'))
);

-- Create marketplace_quotes table for shop responses
CREATE TABLE IF NOT EXISTS marketplace_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES marketplace_jobs(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  quoted_price INTEGER NOT NULL, -- Price in cents
  message TEXT, -- Shop owner's message to customer
  estimated_duration INTEGER, -- Minutes
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(job_id, business_id) -- One quote per business per job
);

-- Enable RLS
ALTER TABLE marketplace_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketplace_jobs
CREATE POLICY "Users can view their own jobs"
ON marketplace_jobs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own jobs"
ON marketplace_jobs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own jobs"
ON marketplace_jobs
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Business owners can view open jobs in their category"
ON marketplace_jobs
FOR SELECT
TO authenticated
USING (
  status = 'open' 
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.owner_id = auth.uid()
  )
);

-- RLS Policies for marketplace_quotes
CREATE POLICY "Users can view quotes for their jobs"
ON marketplace_quotes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM marketplace_jobs
    WHERE marketplace_jobs.id = job_id
    AND marketplace_jobs.user_id = auth.uid()
  )
);

CREATE POLICY "Business owners can view their own quotes"
ON marketplace_quotes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_id
    AND businesses.owner_id = auth.uid()
  )
);

CREATE POLICY "Business owners can create quotes"
ON marketplace_quotes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_id
    AND businesses.owner_id = auth.uid()
  )
);

CREATE POLICY "Business owners can update their own quotes"
ON marketplace_quotes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- Indexes for performance
CREATE INDEX idx_marketplace_jobs_user ON marketplace_jobs(user_id);
CREATE INDEX idx_marketplace_jobs_status ON marketplace_jobs(status);
CREATE INDEX idx_marketplace_jobs_category ON marketplace_jobs(category);
CREATE INDEX idx_marketplace_jobs_created ON marketplace_jobs(created_at DESC);
CREATE INDEX idx_marketplace_quotes_job ON marketplace_quotes(job_id);
CREATE INDEX idx_marketplace_quotes_business ON marketplace_quotes(business_id);
CREATE INDEX idx_marketplace_quotes_status ON marketplace_quotes(status);

-- Comments
COMMENT ON TABLE marketplace_jobs IS 'Customer RFP/quote requests for services';
COMMENT ON TABLE marketplace_quotes IS 'Business owner responses to marketplace jobs';
COMMENT ON COLUMN marketplace_jobs.status IS 'Job lifecycle: open → quoted → accepted → completed';
COMMENT ON COLUMN marketplace_quotes.status IS 'Quote status: pending → accepted/rejected';
