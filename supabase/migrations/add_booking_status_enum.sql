-- Add more detailed status options to bookings table if not already exists
-- Status progression: pending -> confirmed -> in_progress -> ready -> completed

-- First, update existing statuses to handle any old data
UPDATE bookings SET status = 'confirmed' WHERE status = 'paid';

-- Add comment explaining status flow
COMMENT ON COLUMN bookings.status IS 'Booking lifecycle: pending (created) -> confirmed (paid) -> in_progress (mechanic started) -> ready (ready for pickup) -> completed (customer picked up)';

-- Create index for faster status filtering
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
