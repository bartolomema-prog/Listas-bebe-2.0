-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shopping_lists table
CREATE TABLE public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create list_members table for sharing lists with family/team
CREATE TABLE public.list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('viewer', 'editor')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(list_id, user_id)
);

-- Create saved_products table (personal product database for autocomplete)
CREATE TABLE public.saved_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  default_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Create list_items table (products in a shopping list)
CREATE TABLE public.list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_purchased BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Shopping lists policies
CREATE POLICY "Users can view their own lists" 
  ON public.shopping_lists FOR SELECT 
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can view shared lists" 
  ON public.shopping_lists FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.list_members 
    WHERE list_members.list_id = shopping_lists.id 
    AND list_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own lists" 
  ON public.shopping_lists FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own lists" 
  ON public.shopping_lists FOR UPDATE 
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own lists" 
  ON public.shopping_lists FOR DELETE 
  USING (auth.uid() = owner_id);

-- List members policies
CREATE POLICY "Owners can manage list members" 
  ON public.list_members FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.shopping_lists 
    WHERE shopping_lists.id = list_members.list_id 
    AND shopping_lists.owner_id = auth.uid()
  ));

CREATE POLICY "Members can view their membership" 
  ON public.list_members FOR SELECT 
  USING (auth.uid() = user_id);

-- Saved products policies
CREATE POLICY "Users can manage their saved products" 
  ON public.saved_products FOR ALL 
  USING (auth.uid() = user_id);

-- List items policies (owners and editors can manage)
CREATE POLICY "Owners can manage list items" 
  ON public.list_items FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.shopping_lists 
    WHERE shopping_lists.id = list_items.list_id 
    AND shopping_lists.owner_id = auth.uid()
  ));

CREATE POLICY "Editors can manage list items" 
  ON public.list_items FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.list_members 
    WHERE list_members.list_id = list_items.list_id 
    AND list_members.user_id = auth.uid()
    AND list_members.role = 'editor'
  ));

CREATE POLICY "Viewers can view list items" 
  ON public.list_items FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.list_members 
    WHERE list_members.list_id = list_items.list_id 
    AND list_members.user_id = auth.uid()
  ));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON public.shopping_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_products_updated_at
  BEFORE UPDATE ON public.saved_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_list_items_updated_at
  BEFORE UPDATE ON public.list_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$;

-- Trigger for auto-creating profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for collaborative features
ALTER PUBLICATION supabase_realtime ADD TABLE public.list_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_lists;