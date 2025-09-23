-- Add discount_percentage column to sale_items table
ALTER TABLE public.sale_items 
ADD COLUMN discount_percentage numeric DEFAULT 0;