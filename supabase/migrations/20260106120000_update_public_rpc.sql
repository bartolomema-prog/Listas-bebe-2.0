-- Update the function to get list items by share code to include color_status
DROP FUNCTION IF EXISTS public.get_list_items_by_code(text);

CREATE OR REPLACE FUNCTION public.get_list_items_by_code(_code text)
 RETURNS TABLE(
   id uuid, 
   list_id uuid, 
   name text, 
   price numeric, 
   is_purchased boolean, 
   is_reserved boolean, 
   is_green_checked boolean, 
   color_status integer,
   created_at timestamp with time zone, 
   updated_at timestamp with time zone
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    li.id, 
    li.list_id, 
    li.name, 
    li.price, 
    li.is_purchased, 
    li.is_reserved, 
    li.is_green_checked, 
    li.color_status,
    li.created_at, 
    li.updated_at
  FROM public.list_items li
  INNER JOIN public.shopping_lists sl ON sl.id = li.list_id
  WHERE UPPER(sl.share_code) = UPPER(_code)
$function$;
