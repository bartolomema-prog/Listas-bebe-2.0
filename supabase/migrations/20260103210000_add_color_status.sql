-- Add color_status column to list_items table for the color button state
-- 0 = white, 1 = green, 2 = yellow, 3 = red
ALTER TABLE list_items ADD COLUMN IF NOT EXISTS color_status INTEGER DEFAULT 0;
