-- Remove unique constraint from saved_products
ALTER TABLE public.saved_products DROP CONSTRAINT IF EXISTS saved_products_user_id_name_key;
