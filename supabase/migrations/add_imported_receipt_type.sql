-- Add 'imported_receipt' to transaction type enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'imported_receipt' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_type')
  ) THEN
    -- If the enum constraint exists, we need to handle it differently
    -- For simplicity, we'll add the value if the type exists
    BEGIN
      ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'imported_receipt';
    EXCEPTION WHEN OTHERS THEN
      -- If there's no enum type, the constraint might be a CHECK constraint
      -- In that case, we need to update the constraint
      NULL;
    END;
  END IF;
END$$;

-- If transactions table uses CHECK constraint instead of enum
-- Update the constraint to include 'imported_receipt'
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('service', 'imported_receipt'));

-- Add index for imported receipts
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Comments
COMMENT ON COLUMN transactions.type IS 'Transaction type: service (completed booking) or imported_receipt (scanned legacy data)';
