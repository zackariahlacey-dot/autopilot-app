-- Create vehicle_reports table for Verified Autopilot Reports
CREATE TABLE IF NOT EXISTS vehicle_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_slug TEXT UNIQUE NOT NULL,
  
  -- Snapshot data (frozen at time of report generation)
  snapshot_data JSONB NOT NULL,
  health_score INTEGER NOT NULL,
  total_investment INTEGER NOT NULL, -- in cents
  service_count INTEGER NOT NULL,
  
  -- Metadata
  is_public BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_vehicle_report UNIQUE(vehicle_id, generated_at)
);

-- Enable RLS
ALTER TABLE vehicle_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view public reports"
ON vehicle_reports FOR SELECT
TO anon, authenticated
USING (is_public = true);

CREATE POLICY "Users can view their own reports"
ON vehicle_reports FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create reports for their vehicles"
ON vehicle_reports FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reports"
ON vehicle_reports FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_vehicle_reports_vehicle ON vehicle_reports(vehicle_id);
CREATE INDEX idx_vehicle_reports_slug ON vehicle_reports(report_slug);
CREATE INDEX idx_vehicle_reports_user ON vehicle_reports(user_id);
CREATE INDEX idx_vehicle_reports_public ON vehicle_reports(is_public);

-- Function to generate unique report slug
CREATE OR REPLACE FUNCTION generate_report_slug()
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric slug
    slug := lower(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if slug exists
    SELECT EXISTS(SELECT 1 FROM vehicle_reports WHERE report_slug = slug) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE vehicle_reports IS 'Public-facing verified vehicle history reports (Carfax killer)';
COMMENT ON COLUMN vehicle_reports.snapshot_data IS 'Frozen vehicle and service data at time of report generation';
COMMENT ON COLUMN vehicle_reports.report_slug IS 'Public URL slug for sharing (e.g., /report/a3f9k2x1)';
COMMENT ON COLUMN vehicle_reports.health_score IS 'Vehicle health percentage at time of report';
COMMENT ON COLUMN vehicle_reports.view_count IS 'Number of times report has been viewed (for analytics)';
