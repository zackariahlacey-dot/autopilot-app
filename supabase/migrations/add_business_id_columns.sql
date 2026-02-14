-- Add business_id to services table (if not exists)
ALTER TABLE services
ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES businesses(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_services_business_id ON services(business_id);

-- Add business_id to bookings table (if not exists)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES businesses(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_business_id ON bookings(business_id);

-- Add comments to document the columns
COMMENT ON COLUMN services.business_id IS 'References the business that offers this service';
COMMENT ON COLUMN bookings.business_id IS 'References the business providing the service for this booking';
