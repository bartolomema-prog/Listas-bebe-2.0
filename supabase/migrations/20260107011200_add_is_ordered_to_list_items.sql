-- Add is_ordered column to list_items table
ALTER TABLE public.list_items ADD COLUMN is_ordered BOOLEAN NOT NULL DEFAULT false;
