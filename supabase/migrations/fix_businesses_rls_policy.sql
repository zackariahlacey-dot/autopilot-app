-- Fix RLS policy for businesses table to allow unclaimed business inserts
-- This allows authenticated users to insert businesses with NULL owner_id (unclaimed)

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can insert their own businesses" ON businesses;
DROP POLICY IF EXISTS "Allow authenticated inserts" ON businesses;

-- Create new policy that allows:
-- 1. Users to insert businesses they own (owner_id = auth.uid())
-- 2. Users to insert unclaimed businesses (owner_id = NULL)
CREATE POLICY "Allow business inserts for owned and unclaimed"
ON businesses
FOR INSERT
TO authenticated
WITH CHECK (
  owner_id = auth.uid() OR owner_id IS NULL
);

-- Allow authenticated users to read all businesses (both claimed and unclaimed)
DROP POLICY IF EXISTS "Allow public read" ON businesses;
DROP POLICY IF EXISTS "Public businesses are viewable by everyone" ON businesses;

CREATE POLICY "Allow all users to read businesses"
ON businesses
FOR SELECT
TO authenticated
USING (true);

-- Allow users to update businesses they own
DROP POLICY IF EXISTS "Users can update their own businesses" ON businesses;

CREATE POLICY "Allow users to update owned businesses"
ON businesses
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Make sure RLS is enabled
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Add helpful comment
COMMENT ON TABLE businesses IS 'Businesses table with RLS. Authenticated users can insert both owned and unclaimed (owner_id NULL) businesses.';
