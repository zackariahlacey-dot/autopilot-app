-- Add vehicle_id column to bookings table
-- This links each booking to a specific vehicle in the user's garage

ALTER TABLE bookings
ADD COLUMN vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_bookings_vehicle_id ON bookings(vehicle_id);

-- Optional: Add comment to document the column
COMMENT ON COLUMN bookings.vehicle_id IS 'References the vehicle from the users garage for this booking';
