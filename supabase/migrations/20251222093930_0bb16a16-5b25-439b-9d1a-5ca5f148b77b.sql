-- Add purchaser information columns to list_items
ALTER TABLE public.list_items 
ADD COLUMN purchaser_name text,
ADD COLUMN purchaser_phone text,
ADD COLUMN purchase_date date,
ADD COLUMN is_reserved boolean NOT NULL DEFAULT false;