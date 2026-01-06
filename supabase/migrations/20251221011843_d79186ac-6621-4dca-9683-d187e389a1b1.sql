-- Add brand and model columns to list_items
ALTER TABLE public.list_items 
ADD COLUMN brand text,
ADD COLUMN model text;