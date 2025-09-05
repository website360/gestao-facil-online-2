
-- Add discount_percentage column to budget_items table
ALTER TABLE public.budget_items 
ADD COLUMN discount_percentage numeric DEFAULT 0;
