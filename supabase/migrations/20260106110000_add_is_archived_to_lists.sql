-- Add is_archived column to shopping_lists table
ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
