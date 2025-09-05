
-- Add new columns to the products table
ALTER TABLE public.products 
ADD COLUMN stock_unit TEXT DEFAULT 'Peça',
ADD COLUMN width NUMERIC,
ADD COLUMN length NUMERIC,
ADD COLUMN thickness NUMERIC,
ADD COLUMN diameter NUMERIC,
ADD COLUMN size TEXT,
ADD COLUMN composition TEXT,
ADD COLUMN color TEXT,
ADD COLUMN box TEXT,
ADD COLUMN observation TEXT;
