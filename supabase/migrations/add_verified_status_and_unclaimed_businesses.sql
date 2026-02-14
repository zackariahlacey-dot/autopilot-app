-- Add verified status to businesses
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT true;

-- Add comment
COMMENT ON COLUMN businesses.is_verified IS 'Whether this business is claimed/verified by an owner. False for marketplace listings.';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_businesses_is_verified ON businesses(is_verified);

-- Insert some unclaimed businesses for the marketplace
INSERT INTO businesses (name, category, address, is_verified, owner_id) VALUES
  ('Jiffy Lube Express', 'oil_change', '123 Main St, Burlington, VT 05401', false, NULL),
  ('Midas Auto Service', 'mechanic', '456 Church St, Burlington, VT 05401', false, NULL),
  ('Safelite AutoGlass', 'glass_repair', '789 Williston Rd, South Burlington, VT 05403', false, NULL),
  ('Valvoline Instant Oil Change', 'oil_change', '321 Shelburne Rd, Burlington, VT 05401', false, NULL),
  ('Maaco Collision Repair', 'body_shop', '654 Pine St, Burlington, VT 05401', false, NULL)
ON CONFLICT (name, address) DO NOTHING;
