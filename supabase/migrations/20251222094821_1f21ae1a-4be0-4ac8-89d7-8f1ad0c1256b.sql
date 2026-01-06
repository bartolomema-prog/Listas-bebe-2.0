-- Add green status checkbox field
ALTER TABLE public.list_items ADD COLUMN IF NOT EXISTS is_green_checked boolean DEFAULT false;