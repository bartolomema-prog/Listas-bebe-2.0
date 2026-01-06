
-- Add share_code column to shopping_lists
ALTER TABLE public.shopping_lists 
ADD COLUMN share_code text UNIQUE;

-- Generate unique codes for existing lists
UPDATE public.shopping_lists 
SET share_code = UPPER(SUBSTR(MD5(RANDOM()::text), 1, 6))
WHERE share_code IS NULL;

-- Make share_code NOT NULL and set default for new lists
ALTER TABLE public.shopping_lists 
ALTER COLUMN share_code SET NOT NULL,
ALTER COLUMN share_code SET DEFAULT UPPER(SUBSTR(MD5(RANDOM()::text), 1, 6));

-- Create function to get list by share code (public access)
CREATE OR REPLACE FUNCTION public.get_list_by_code(_code text)
RETURNS TABLE (
  id uuid,
  name text,
  baby_name text,
  father_name text,
  mother_name text,
  phone text,
  owner_id uuid,
  share_code text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, baby_name, father_name, mother_name, phone, owner_id, share_code, created_at, updated_at
  FROM public.shopping_lists
  WHERE UPPER(share_code) = UPPER(_code)
$$;

-- Create function to get list items by share code (public access)
CREATE OR REPLACE FUNCTION public.get_list_items_by_code(_code text)
RETURNS TABLE (
  id uuid,
  list_id uuid,
  name text,
  price numeric,
  is_purchased boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT li.id, li.list_id, li.name, li.price, li.is_purchased, li.created_at, li.updated_at
  FROM public.list_items li
  INNER JOIN public.shopping_lists sl ON sl.id = li.list_id
  WHERE UPPER(sl.share_code) = UPPER(_code)
$$;
