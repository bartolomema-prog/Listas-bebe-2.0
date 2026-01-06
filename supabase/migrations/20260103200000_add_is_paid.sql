-- Add is_paid column to list_items table
ALTER TABLE list_items ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;

-- Update existing records to set is_paid based on whether they have payment info
UPDATE list_items 
SET is_paid = false 
WHERE is_purchased = true AND is_paid IS NULL;
