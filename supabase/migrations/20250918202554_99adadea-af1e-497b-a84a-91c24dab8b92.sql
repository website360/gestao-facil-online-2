-- Add dimension columns to sale_volumes table
ALTER TABLE public.sale_volumes
ADD COLUMN IF NOT EXISTS width_cm DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS height_cm DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS length_cm DECIMAL(10,2);