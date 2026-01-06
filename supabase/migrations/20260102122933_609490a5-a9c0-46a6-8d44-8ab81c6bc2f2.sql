-- Add is_picked_up column to list_items
ALTER TABLE public.list_items ADD COLUMN is_picked_up boolean DEFAULT false;

-- Change purchase_date from date to timestamp with time zone
ALTER TABLE public.list_items 
  ALTER COLUMN purchase_date TYPE timestamp with time zone 
  USING purchase_date::timestamp with time zone;