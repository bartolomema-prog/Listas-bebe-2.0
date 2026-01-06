-- Add brand and model columns to saved_products
ALTER TABLE public.saved_products 
ADD COLUMN brand text,
ADD COLUMN model text;