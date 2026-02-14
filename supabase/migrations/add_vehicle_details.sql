-- Add additional vehicle fields for the Digital Twin HUD

ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS mileage integer,
ADD COLUMN IF NOT EXISTS license_plate text;

-- Add index for license plate lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);

-- Add comments
COMMENT ON COLUMN vehicles.mileage IS 'Current mileage of the vehicle';
COMMENT ON COLUMN vehicles.license_plate IS 'Vehicle license plate number';
