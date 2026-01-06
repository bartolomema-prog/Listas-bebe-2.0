
-- Create security definer functions to avoid RLS recursion

-- Function to check if user is owner of a shopping list
CREATE OR REPLACE FUNCTION public.is_list_owner(_list_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shopping_lists
    WHERE id = _list_id
      AND owner_id = _user_id
  )
$$;

-- Function to check if user is a member of a shopping list
CREATE OR REPLACE FUNCTION public.is_list_member(_list_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.list_members
    WHERE list_id = _list_id
      AND user_id = _user_id
  )
$$;

-- Function to check if user is an editor of a shopping list
CREATE OR REPLACE FUNCTION public.is_list_editor(_list_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.list_members
    WHERE list_id = _list_id
      AND user_id = _user_id
      AND role = 'editor'
  )
$$;

-- Drop existing problematic policies on shopping_lists
DROP POLICY IF EXISTS "Users can view shared lists" ON public.shopping_lists;
DROP POLICY IF EXISTS "Users can view their own lists" ON public.shopping_lists;
DROP POLICY IF EXISTS "Users can create their own lists" ON public.shopping_lists;
DROP POLICY IF EXISTS "Users can update their own lists" ON public.shopping_lists;
DROP POLICY IF EXISTS "Users can delete their own lists" ON public.shopping_lists;

-- Drop existing problematic policies on list_members
DROP POLICY IF EXISTS "Owners can manage list members" ON public.list_members;
DROP POLICY IF EXISTS "Members can view their membership" ON public.list_members;

-- Drop existing problematic policies on list_items
DROP POLICY IF EXISTS "Owners can manage list items" ON public.list_items;
DROP POLICY IF EXISTS "Editors can manage list items" ON public.list_items;
DROP POLICY IF EXISTS "Viewers can view list items" ON public.list_items;

-- Recreate shopping_lists policies WITHOUT circular references
CREATE POLICY "Users can view their own lists" 
ON public.shopping_lists 
FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can view shared lists" 
ON public.shopping_lists 
FOR SELECT 
USING (public.is_list_member(id, auth.uid()));

CREATE POLICY "Users can create their own lists" 
ON public.shopping_lists 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own lists" 
ON public.shopping_lists 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own lists" 
ON public.shopping_lists 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Recreate list_members policies using security definer function
CREATE POLICY "Owners can manage list members" 
ON public.list_members 
FOR ALL 
USING (public.is_list_owner(list_id, auth.uid()));

CREATE POLICY "Members can view their membership" 
ON public.list_members 
FOR SELECT 
USING (auth.uid() = user_id);

-- Recreate list_items policies using security definer functions
CREATE POLICY "Owners can manage list items" 
ON public.list_items 
FOR ALL 
USING (public.is_list_owner(list_id, auth.uid()));

CREATE POLICY "Editors can manage list items" 
ON public.list_items 
FOR ALL 
USING (public.is_list_editor(list_id, auth.uid()));

CREATE POLICY "Members can view list items" 
ON public.list_items 
FOR SELECT 
USING (public.is_list_member(list_id, auth.uid()));
