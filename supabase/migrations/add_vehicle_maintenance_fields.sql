-- Add maintenance tracking fields to vehicles table

ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS last_oil_change date,
ADD COLUMN IF NOT EXISTS last_detail date,
ADD COLUMN IF NOT EXISTS mileage_at_last_oil integer;

-- Add comments
COMMENT ON COLUMN vehicles.last_oil_change IS 'Date of the most recent oil change';
COMMENT ON COLUMN vehicles.last_detail IS 'Date of the most recent detail service';
COMMENT ON COLUMN vehicles.mileage_at_last_oil IS 'Mileage reading at time of last oil change';
