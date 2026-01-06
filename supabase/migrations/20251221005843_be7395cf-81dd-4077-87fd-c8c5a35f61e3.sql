
-- Add new columns to shopping_lists table for baby registry
ALTER TABLE public.shopping_lists 
ADD COLUMN baby_name text,
ADD COLUMN father_name text,
ADD COLUMN mother_name text,
ADD COLUMN phone text;

-- Update the name column to be optional since we'll use baby_name
ALTER TABLE public.shopping_lists 
ALTER COLUMN name DROP NOT NULL;
